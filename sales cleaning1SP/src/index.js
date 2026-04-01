require('dotenv').config();
const express = require('express');
const { query, closeAllDatabases, getAvailableKeys } = require('./config/db');
const cleanupRoutes = require('./routes/cleanupRoutes');

const app = express();
app.use(express.json());

app.get('/test-db/:dbKey', async (req, res) => {
  const { dbKey } = req.params;

  if (!getAvailableKeys().includes(dbKey)) {
    return res.status(400).json({
      ok: false,
      message: `dbKey inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  try {
    const rows = await query(dbKey, 'SELECT NOW() AS now_time, DATABASE() AS db_name');
    res.json({ ok: true, dbKey, data: rows });
  } catch (error) {
    console.error(`Error en /test-db/${dbKey}:`, error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.get('/:dbKey/empresa/:id/documentos', async (req, res) => {
  const { dbKey, id } = req.params;
  const companyId = Number(id);

  if (!getAvailableKeys().includes(dbKey)) {
    return res.status(400).json({
      ok: false,
      message: `dbKey inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({ ok: false, message: 'ID de empresa inválido' });
  }

  try {
    const rows = await query(
      dbKey,
      `SELECT COUNT(*) AS total
       FROM sal_documents
       WHERE com_company_id = ?
         AND deleted_at IS NULL`,
      [companyId]
    );
    res.json({ ok: true, dbKey, companyId, data: rows[0] });
  } catch (error) {
    console.error(`Error en /${dbKey}/empresa/${companyId}/documentos:`, error);
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Rutas de limpieza
app.use(cleanupRoutes);

const port = Number(process.env.PORT || 3000);

async function startServer() {
  app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`BDs disponibles: ${getAvailableKeys().join(', ')}`);
    console.log('Las conexiones SSH+MySQL se abren bajo demanda por cada BD');
  });
}

process.on('SIGINT', async () => {
  console.log('\n[SERVER] Cerrando conexiones...');
  await closeAllDatabases();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[SERVER] Cerrando conexiones...');
  await closeAllDatabases();
  process.exit(0);
});

startServer();