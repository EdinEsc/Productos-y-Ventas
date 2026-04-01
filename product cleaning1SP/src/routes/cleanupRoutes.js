const express = require('express');
const { ejecutarLimpieza } = require('../services/cleanupService');
const { leerEstado, borrarEstado } = require('../utils/cleanupState');
const { getAvailableKeys } = require('../config/db');

const router = express.Router();

const procesosActivos = new Set();

function procesoKey(dbKey, companyId, warehouseIds = '') {
  return `${dbKey}_${companyId}_${warehouseIds}`;
}

// GET /limpiar/:db_target/:company_id?warehouses=9331,4218,3388
router.get('/limpiar/:db_target/:company_id', async (req, res) => {
  const { db_target, company_id } = req.params;
  const { warehouses } = req.query; // Ej: ?warehouses=9331,4218,3388
  const companyId = Number(company_id);
  
  let warehouseIdsArray = [];
  if (warehouses) {
    warehouseIdsArray = warehouses.split(',').map(id => Number(id.trim()));
  }

  if (!db_target || !getAvailableKeys().includes(db_target)) {
    return res.status(400).json({
      ok: false,
      message: `db_target inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ ok: false, message: 'company_id inválido' });
  }

  const key = procesoKey(db_target, companyId, warehouses || '');

  if (procesosActivos.has(key)) {
    return res.status(409).json({
      ok: false,
      message: `Ya hay un proceso activo para ${db_target} / company_id=${companyId}`,
    });
  }

  res.json({
    ok: true,
    message: `Proceso iniciado: ${db_target} / company_id=${companyId}${warehouses ? ` / warehouses: ${warehouses}` : ''}`,
  });

  procesosActivos.add(key);
  
  ejecutarLimpieza(db_target, companyId, warehouseIdsArray)
    .catch((err) => console.error(`[CLEANUP][${db_target}] Error:`, err.message))
    .finally(() => procesosActivos.delete(key));
});

// El resto de las rutas igual...
router.get('/limpiar/estado/:db_target/:company_id', (req, res) => {
  const { db_target, company_id } = req.params;
  const companyId = Number(company_id);

  if (!db_target || !companyId) {
    return res.status(400).json({ ok: false, message: 'Parámetros inválidos' });
  }

  const key = procesoKey(db_target, companyId, req.query.warehouses || '');
  const estado = leerEstado(key);
  
  res.json({
    procesoActivo: procesosActivos.has(key),
    db_target,
    company_id: companyId,
    avance: estado || 'Sin proceso previo',
  });
});

router.delete('/limpiar/estado/:db_target/:company_id', (req, res) => {
  const { db_target, company_id } = req.params;
  const companyId = Number(company_id);

  if (!db_target || !companyId) {
    return res.status(400).json({ ok: false, message: 'Parámetros inválidos' });
  }

  const key = procesoKey(db_target, companyId, req.query.warehouses || '');
  borrarEstado(key);
  res.json({ ok: true, message: `Estado borrado para ${key}` });
});

router.post('/limpiar', async (req, res) => {
  const { db_target, company_id, warehouses } = req.body;
  const companyId = Number(company_id);
  
  let warehouseIdsArray = warehouses || [];

  if (!db_target || !getAvailableKeys().includes(db_target)) {
    return res.status(400).json({
      ok: false,
      message: `db_target inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ ok: false, message: 'company_id inválido' });
  }

  const key = procesoKey(db_target, companyId, warehouseIdsArray.join(','));

  if (procesosActivos.has(key)) {
    return res.status(409).json({
      ok: false,
      message: `Ya hay un proceso activo para ${db_target} / company_id=${companyId}`,
    });
  }

  res.json({
    ok: true,
    message: `Proceso iniciado: ${db_target} / company_id=${companyId}${warehouseIdsArray.length ? ` / warehouses: ${warehouseIdsArray.join(',')}` : ''}`,
  });

  procesosActivos.add(key);

  ejecutarLimpieza(db_target, companyId, warehouseIdsArray)
    .catch((err) => console.error(`[CLEANUP][${db_target}] Error:`, err.message))
    .finally(() => procesosActivos.delete(key));
});

router.get('/limpiar/estado', (req, res) => {
  const { db_target, company_id, warehouses } = req.query;

  if (db_target && company_id) {
    const key = procesoKey(db_target, Number(company_id), warehouses || '');
    return res.json({
      procesoActivo: procesosActivos.has(key),
      avance: leerEstado(key) || 'Sin proceso previo',
    });
  }

  res.json({
    procesosActivos: [...procesosActivos],
    disponibles: getAvailableKeys(),
  });
});

router.delete('/limpiar/estado', (req, res) => {
  const { db_target, company_id, warehouses } = req.query;

  if (!db_target || !company_id) {
    return res.status(400).json({ ok: false, message: 'Faltan db_target y company_id' });
  }

  const key = procesoKey(db_target, Number(company_id), warehouses || '');
  borrarEstado(key);
  res.json({ ok: true, message: `Estado borrado para ${key}` });
});

module.exports = router;