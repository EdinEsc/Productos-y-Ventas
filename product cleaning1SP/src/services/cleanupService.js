const { execute: dbExecute } = require('../config/db');
const { leerEstado, guardarEstado, borrarEstado } = require('../utils/cleanupState');

const BATCH_SMALL = 5000;
const BATCH_BIG = 10000;

const TODAS_LAS_TABLAS = [
  { tabla: 'war_products',                tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
  { tabla: 'war_warehouses_products',     tipo: 'lote', campo_empresa: null,             lote: BATCH_BIG, especial: 'warehouse' },
  { tabla: 'war_brands',                  tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_SMALL, especial: 'brand' },
  { tabla: 'war_document_kardex',         tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
  { tabla: 'war_inventory',               tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
  { tabla: 'war_kardex',                  tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
  { tabla: 'war_ms_categories',           tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'war_ms_features',             tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_SMALL },
  { tabla: 'war_ms_units',                tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_SMALL, especial: 'unit' },
  { tabla: 'war_products_taxes',          tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
  { tabla: 'war_transfers',               tipo: 'lote', campo_empresa: 'company_id',     lote: BATCH_BIG },
];

function log(dbKey, msg) {
  console.log(`[CLEANUP][${dbKey}] ${new Date().toISOString()} ${msg}`);
}

function stateKey(dbKey, companyId, warehouseIds = []) {
  const suffix = warehouseIds.length ? `_${warehouseIds.join('_')}` : '';
  return `${dbKey}_${companyId}${suffix}`;
}

async function procesarTablaEnLotes(dbKey, tabla, campoEmpresa, companyId, batchSize, especial = null, warehouseIds = []) {
  let total = 0;
  let affectedRows = 1;

  // Caso especial: war_warehouses_products (usa warehouse_ids pasados por parámetro)
  if (especial === 'warehouse') {
    if (warehouseIds.length === 0) {
      log(dbKey, `  ${tabla} — No se pasaron warehouse_ids, omitiendo tabla`);
      return 0;
    }
    
    log(dbKey, `  ${tabla} — Warehouse IDs: ${warehouseIds.join(', ')}`);
    const placeholders = warehouseIds.map(() => '?').join(',');
    
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    
    while (affectedRows > 0) {
      try {
        const result = await dbExecute(
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
        reconnectAttempts = 0;
        if (affectedRows > 0) {
          log(dbKey, `  ${tabla} — lote: ${affectedRows} filas (total: ${total})`);
        }
      } catch (err) {
        if (err.message.includes('Connection lost') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          log(dbKey, `  ${tabla} — Conexión perdida, reintentando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          throw err;
        }
      }
    }
    return total;
  }

  // Caso especial: war_brands (excluir flag_default = 1)
  if (especial === 'brand') {
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    
    while (affectedRows > 0) {
      try {
        const result = await dbExecute(
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
        reconnectAttempts = 0;
        if (affectedRows > 0) {
          log(dbKey, `  ${tabla} — lote: ${affectedRows} filas (total: ${total})`);
        }
      } catch (err) {
        if (err.message.includes('Connection lost') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          log(dbKey, `  ${tabla} — Conexión perdida, reintentando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          throw err;
        }
      }
    }
    return total;
  }

  // Caso especial: war_ms_units (excluir flag_default = 1)
  if (especial === 'unit') {
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    
    while (affectedRows > 0) {
      try {
        const result = await dbExecute(
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
        reconnectAttempts = 0;
        if (affectedRows > 0) {
          log(dbKey, `  ${tabla} — lote: ${affectedRows} filas (total: ${total})`);
        }
      } catch (err) {
        if (err.message.includes('Connection lost') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          log(dbKey, `  ${tabla} — Conexión perdida, reintentando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          throw err;
        }
      }
    }
    return total;
  }

  // Comportamiento normal
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;
  
  while (affectedRows > 0) {
    try {
      const result = await dbExecute(
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
      reconnectAttempts = 0;
      if (affectedRows > 0) {
        log(dbKey, `  ${tabla} — lote: ${affectedRows} filas (total: ${total})`);
      }
    } catch (err) {
      if (err.message.includes('Connection lost') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        log(dbKey, `  ${tabla} — Conexión perdida, reintentando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      } else {
        throw err;
      }
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
    log(dbKey, `Reanudando. Tablas ya completadas: ${[...tablasDoneSet].join(', ') || 'ninguna'}`);
  } else {
    log(dbKey, `Iniciando proceso nuevo para company_id=${companyId}${warehouseIds.length ? `, warehouses: ${warehouseIds.join(',')}` : ''}`);
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
    for (const { tabla, tipo, campo_empresa, lote, especial } of TODAS_LAS_TABLAS) {
      if (tablasDoneSet.has(tabla)) {
        log(dbKey, `Saltando ${tabla} (ya completada)`);
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
    }

    borrarEstado(key);
    log(dbKey, `===== PROCESO TERMINADO OK para company_id=${companyId} =====`);
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