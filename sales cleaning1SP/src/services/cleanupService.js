const { execute: dbExecute } = require('../config/db');
const { leerEstado, guardarEstado, borrarEstado } = require('../utils/cleanupState');

const BATCH_SMALL = 5000;
const BATCH_BIG = 10000;

const MAX_RETRIES = 3;

const TODAS_LAS_TABLAS = [
  { tabla: 'com_cash',                     tipo: 'simple', campo_empresa: 'company_id' },
  { tabla: 'sal_series',                   tipo: 'simple', campo_empresa: 'company_id' },
  { tabla: 'ca_documents',                tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'ca_documents_details',        tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'pur_documents',               tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'com_transaction_bank',        tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'sal_cash_desk_closing',       tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'sal_orders',                  tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'sal_transactions',            tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'com_document_account_status', tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'sal_remission_guides',        tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'ca_amortizations',            tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_BIG   },
  { tabla: 'ca_amortizations_details',    tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_BIG   },
  { tabla: 'com_cash_movement',           tipo: 'lote',   campo_empresa: 'company_id',     lote: BATCH_BIG   },
  { tabla: 'sal_documents',               tipo: 'lote',   campo_empresa: 'com_company_id', lote: BATCH_BIG   },
];

function log(dbKey, msg) {
  console.log(`[CLEANUP][${dbKey}] ${new Date().toISOString()} ${msg}`);
}

function stateKey(dbKey, companyId) {
  return `${dbKey}_${companyId}`;
}

async function executeWithRetry(dbKey, sql, params) {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      return await dbExecute(dbKey, sql, params, { batch: true });
    } catch (err) {
      attempts++;

      if (err.message.includes('Connection lost') && attempts < MAX_RETRIES) {
        log(dbKey, `Reintentando (${attempts}/${MAX_RETRIES})...`);
        await new Promise(res => setTimeout(res, 2000));
      } else {
        throw err;
      }
    }
  }
}

async function procesarTablaSimple(dbKey, tabla, campoEmpresa, companyId) {
  if (tabla === 'com_cash') {
    await executeWithRetry(
      dbKey,
      `UPDATE com_cash SET balance = '{}' WHERE company_id = ?`,
      [companyId]
    );
  } else if (tabla === 'sal_series') {
    await executeWithRetry(
      dbKey,
      `UPDATE sal_series
       SET number = 0
       WHERE company_id = ?
         AND sal_type_documents_id NOT IN (1,2)
         AND number <> 0`,
      [companyId]
    );
  }
}

async function procesarTablaEnLotes(dbKey, tabla, campoEmpresa, companyId, batchSize) {
  let total = 0;
  let affectedRows = 1;

  while (affectedRows > 0) {
    const result = await executeWithRetry(
      dbKey,
      `UPDATE ${tabla}
       SET deleted_at = NOW()
       WHERE ${campoEmpresa} = ?
         AND deleted_at IS NULL
       LIMIT ${batchSize}`,
      [companyId]
    );

    affectedRows = result.affectedRows ?? 0;
    total += affectedRows;

    if (affectedRows > 0) {
      log(dbKey, `  ${tabla} — lote: ${affectedRows} filas (total: ${total})`);
    }
  }

  return total;
}

async function ejecutarLimpieza(dbKey, companyId) {
  const key = stateKey(dbKey, companyId);
  const estadoAnterior = leerEstado(key);
  let tablasDoneSet = new Set();

  if (estadoAnterior && estadoAnterior.estado === 'error') {
    tablasDoneSet = new Set(estadoAnterior.tablas_completadas || []);
    log(dbKey, `Reanudando. Tablas ya completadas: ${[...tablasDoneSet].join(', ') || 'ninguna'}`);
  } else {
    log(dbKey, `Iniciando proceso nuevo para company_id=${companyId}`);
  }

  guardarEstado(key, {
    db_key: dbKey,
    company_id: companyId,
    estado: 'ejecutando',
    tabla_actual: null,
    tablas_completadas: [...tablasDoneSet],
    fecha_inicio: new Date().toISOString(),
    error: null,
  });

  try {
    for (const { tabla, tipo, campo_empresa, lote } of TODAS_LAS_TABLAS) {
      if (tablasDoneSet.has(tabla)) {
        log(dbKey, `Saltando ${tabla} (ya completada)`);
        continue;
      }

      log(dbKey, `INICIO ${tabla}`);

      guardarEstado(key, {
        db_key: dbKey,
        company_id: companyId,
        estado: 'ejecutando',
        tabla_actual: tabla,
        tablas_completadas: [...tablasDoneSet],
        fecha_inicio: new Date().toISOString(),
        error: null,
      });

      if (tipo === 'simple') {
        await procesarTablaSimple(dbKey, tabla, campo_empresa, companyId);
      } else {
        await procesarTablaEnLotes(dbKey, tabla, campo_empresa, companyId, lote);
      }

      tablasDoneSet.add(tabla);
      log(dbKey, `FIN ${tabla}`);

      guardarEstado(key, {
        db_key: dbKey,
        company_id: companyId,
        estado: 'ejecutando',
        tabla_actual: tabla,
        tablas_completadas: [...tablasDoneSet],
        fecha_inicio: new Date().toISOString(),
        error: null,
      });
    }

    borrarEstado(key);
    log(dbKey, `===== PROCESO TERMINADO OK para company_id=${companyId} =====`);

  } catch (err) {
    guardarEstado(key, {
      db_key: dbKey,
      company_id: companyId,
      estado: 'error',
      tabla_actual: null,
      tablas_completadas: [...tablasDoneSet],
      fecha_inicio: new Date().toISOString(),
      error: err.message,
    });

    log(dbKey, `ERROR: ${err.message}`);
    throw err;
  }
}

module.exports = { ejecutarLimpieza };