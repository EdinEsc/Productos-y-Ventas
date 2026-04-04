const express = require('express');
const { ejecutarLimpieza } = require('../services/cleanupService');
const { leerEstado, borrarEstado } = require('../utils/cleanupState');
const { getAvailableKeys } = require('../config/db');

const router = express.Router();
const procesosActivos = new Set();

function procesoKey(dbKey, companyId, warehouseIds = []) {
  const sorted = [...warehouseIds].sort();
  return `${dbKey}_${companyId}_${sorted.join('_')}`;
}

function parseWarehouses(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(Number);
  return input.split(',').map(id => Number(id.trim()));
}

router.post('/limpiar', async (req, res) => {
  const { db_target, company_id, warehouses } = req.body;
  const companyId = Number(company_id);
  const warehouseIds = parseWarehouses(warehouses);

  if (!db_target || !getAvailableKeys().includes(db_target)) {
    return res.status(400).json({
      ok: false,
      message: `db_target inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  if (isNaN(companyId)) {
    return res.status(400).json({ ok: false, message: 'company_id inválido' });
  }

  const key = procesoKey(db_target, companyId, warehouseIds);

  if (procesosActivos.has(key)) {
    return res.status(409).json({
      ok: false,
      message: `Proceso activo para ${key}`,
    });
  }

  res.json({
    ok: true,
    processId: key,
    message: `Proceso iniciado`,
  });

  procesosActivos.add(key);

  ejecutarLimpieza(db_target, companyId, warehouseIds)
    .catch(err => console.error(`[CLEANUP][${db_target}]`, err.message))
    .finally(() => procesosActivos.delete(key));
});

router.get('/limpiar/estado', (req, res) => {
  const { db_target, company_id, warehouses } = req.query;

  if (db_target && company_id) {
    const key = procesoKey(
      db_target,
      Number(company_id),
      parseWarehouses(warehouses)
    );

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
    return res.status(400).json({
      ok: false,
      message: 'Faltan parámetros',
    });
  }

  const key = procesoKey(
    db_target,
    Number(company_id),
    parseWarehouses(warehouses)
  );

  borrarEstado(key);

  res.json({ ok: true, message: `Estado borrado: ${key}` });
});

module.exports = router;