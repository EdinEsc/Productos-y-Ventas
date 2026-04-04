require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query, closeAllDatabases, getAvailableKeys } = require('./config/db');
const cleanupRoutes = require('./routes/cleanupRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test-db/:dbKey', async (req, res) => {
  const { dbKey } = req.params;

  if (!getAvailableKeys().includes(dbKey)) {
    return res.status(400).json({
      ok: false,
      message: `dbKey inválido. Opciones: ${getAvailableKeys().join(', ')}`,
    });
  }

  try {
    const rows = await query(
      dbKey,
      'SELECT NOW() AS now_time, DATABASE() AS db_name'
    );

    res.json({ ok: true, dbKey, data: rows });
  } catch (error) {
    console.error(`[ERROR][test-db][${dbKey}]`, error.message);
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.use('/api', cleanupRoutes);

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor',
  });
});

const port = Number(process.env.PORT || 3000);

async function startServer() {
  app.listen(port, () => {
    console.log(`[SERVER] Corriendo en puerto ${port}`);
    console.log(`[SERVER] BDs disponibles: ${getAvailableKeys().join(', ')}`);
    console.log('[SERVER] Conexiones SSH+MySQL bajo demanda');
  });
}

async function shutdown() {
  console.log('\n[SERVER] Cerrando conexiones...');
  await closeAllDatabases();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();