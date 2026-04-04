const { execute: dbExecute } = require('../config/db');
const { leerEstado, guardarEstado, borrarEstado } = require('../utils/cleanupState');

const BATCH_SMALL = 5000;
const BATCH_BIG = 10000;

const TODAS_LAS_TABLAS = [
  { tabla: 'war_products',                campo_empresa: 'company_id', lote: BATCH_BIG },
  { tabla: 'war_warehouses_products',     campo_empresa: null,         lote: BATCH_BIG, especial: 'warehouse' },
  { tabla: 'war_brands',                  campo_empresa: 'company_id', lote: BATCH_SMALL, especial: 'brand' },
  { tabla: 'war_document_kardex',         campo_empresa: 'company_id', lote: BATCH_BIG },
  { tabla: 'war_inventory',               campo_empresa: 'company_id', lote: BATCH_BIG },
  { tabla: 'war_kardex',                  campo_empresa: 'company_id', lote: BATCH_BIG },
  { tabla: 'war_ms_categories',           campo_empresa: 'company_id', lote: BATCH_SMALL },
  { tabla: 'war_ms_features',             campo_empresa: 'company_id', lote: BATCH_SMALL },
  { tabla: 'war_ms_units',                campo_empresa: 'company_id', lote: BATCH_SMALL, especial: 'unit' },
  { tabla: 'war_products_taxes',          campo_empresa: 'company_id', lote: BATCH_BIG },
  { tabla: 'war_transfers',               campo_empresa: 'company_id', lote: BATCH_BIG },
];

function log(dbKey, msg) {
  console.log(`[CLEANUP][${dbKey}] ${new Date().toISOString()} ${msg}`);
}

function stateKey(dbKey, companyId, warehouseIds = []) {
  const suffix = warehouseIds.length ? `_${warehouseIds.join('_')}` : '';
  return `${dbKey}_${companyId}${suffix}`;
}

async function executeWithRetry(dbKey, sql, params = [], maxRetries = 3) {
  let attempts = 0;

  while (true) {
    try {
      return await dbExecute(dbKey, sql, params, { batch: true });
    } catch (err) {
      if (err.message.includes('Connection lost') && attempts < maxRetries) {
        attempts++;
        log(dbKey, `Reintentando conexión (${attempts}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, 2000));
      } else {
        throw err;
      }
    }
  }
}

async function procesarTablaEnLotes(dbKey, tabla, campoEmpresa, companyId, batchSize, especial = null, warehouseIds = []) {
  let total = 0;
  let affectedRows = 1;

  if (especial === 'warehouse') {
    if (warehouseIds.length === 0) {
      log(dbKey, `${tabla} — sin warehouse_ids, omitido`);
      return 0;
    }

    const placeholders = warehouseIds.map(() => '?').join(',');

    while (affectedRows > 0) {
      const result = await executeWithRetry(
        dbKey,
        `UPDATE ${tabla}
         SET deleted_at = NOW()
         WHERE warehouse_id IN (${placeholders})
           AND deleted_at IS NULL
         LIMIT ${batchSize}`,
        warehouseIds
      );

      affectedRows = result.affectedRows ?? 0;
      total += affectedRows;

      if (affectedRows > 0) {
        log(dbKey, `${tabla} — lote: ${affectedRows} (total: ${total})`);
      }
    }

    return total;
  }

  if (especial === 'brand' || especial === 'unit') {
    while (affectedRows > 0) {
      const result = await executeWithRetry(
        dbKey,
        `UPDATE ${tabla}
         SET deleted_at = NOW()
         WHERE ${campoEmpresa} = ?
           AND flag_default != 1
           AND deleted_at IS NULL
         LIMIT ${batchSize}`,
        [companyId]
      );

      affectedRows = result.affectedRows ?? 0;
      total += affectedRows;

      if (affectedRows > 0) {
        log(dbKey, `${tabla} — lote: ${affectedRows} (total: ${total})`);
      }
    }

    return total;
  }

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
      log(dbKey, `${tabla} — lote: ${affectedRows} (total: ${total})`);
    }
  }

  return total;
}

async function ejecutarLimpieza(dbKey, companyId, warehouseIds = []) {
  const key = stateKey(dbKey, companyId, warehouseIds);
  const estadoAnterior = leerEstado(key);
  let tablasDoneSet = new Set();

  if (estadoAnterior && estadoAnterior.estado === 'error') {
    tablasDoneSet = new Set(estadoAnterior.tablas_completadas || []);
    log(dbKey, `Reanudando. Tablas completadas: ${[...tablasDoneSet].join(', ')}`);
  } else {
    log(dbKey, `Inicio limpieza company_id=${companyId}`);
  }

  guardarEstado(key, {
    db_key: dbKey,
    company_id: companyId,
    warehouse_ids: warehouseIds,
    estado: 'ejecutando',
    tabla_actual: null,
    tablas_completadas: [...tablasDoneSet],
    fecha_inicio: new Date().toISOString(),
    error: null,
  });

  try {
    for (const { tabla, campo_empresa, lote, especial } of TODAS_LAS_TABLAS) {
      if (tablasDoneSet.has(tabla)) {
        log(dbKey, `Saltando ${tabla}`);
        continue;
      }

      log(dbKey, `INICIO ${tabla}`);

      guardarEstado(key, {
        db_key: dbKey,
        company_id: companyId,
        warehouse_ids: warehouseIds,
        estado: 'ejecutando',
        tabla_actual: tabla,
        tablas_completadas: [...tablasDoneSet],
        fecha_inicio: new Date().toISOString(),
        error: null,
      });

      await procesarTablaEnLotes(dbKey, tabla, campo_empresa, companyId, lote, especial, warehouseIds);

      tablasDoneSet.add(tabla);

      log(dbKey, `FIN ${tabla}`);
    }

    borrarEstado(key);
    log(dbKey, `===== LIMPIEZA TERMINADA OK =====`);

  } catch (err) {
    guardarEstado(key, {
      db_key: dbKey,
      company_id: companyId,
      warehouse_ids: warehouseIds,
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