require('dotenv').config();
const fs = require('fs');
const { Client } = require('ssh2');
const mysql = require('mysql2/promise');

const activeConnections = {};
const pendingConnections = {};

function getDbConfig(dbKey) {
  const configs = {
    db1: { host: process.env.DB1_HOST, name: process.env.DB1_NAME },
    db2: { host: process.env.DB2_HOST, name: process.env.DB2_NAME },
    db3: { host: process.env.DB3_HOST, name: process.env.DB3_NAME },
    db4: { host: process.env.DB4_HOST, name: process.env.DB4_NAME },
    db5: { host: process.env.DB5_HOST, name: process.env.DB5_NAME },
  };

  const cfg = configs[dbKey];
  if (!cfg || !cfg.host || !cfg.name) {
    throw new Error(`Base de datos desconocida o sin configuración: "${dbKey}"`);
  }
  return cfg;
}

function getAvailableKeys() {
  return ['db1', 'db2', 'db3', 'db4', 'db5'];
}

async function connectDatabase(dbKey) {
  if (activeConnections[dbKey]) {
    return activeConnections[dbKey].connection;
  }

  if (pendingConnections[dbKey]) {
    return pendingConnections[dbKey];
  }

  const cfg = getDbConfig(dbKey);

  pendingConnections[dbKey] = _createConnection(dbKey, cfg)
    .then((result) => {
      activeConnections[dbKey] = result;
      delete pendingConnections[dbKey];
      return result.connection;
    })
    .catch((err) => {
      delete pendingConnections[dbKey];
      throw err;
    });

  return pendingConnections[dbKey];
}

async function _createConnection(dbKey, cfg) {
  const privateKey = fs.readFileSync(process.env.SSH_KEY_PATH);

  return new Promise((resolve, reject) => {
    const ssh = new Client();

    ssh
      .on('ready', () => {
        ssh.forwardOut(
          '127.0.0.1',
          0,
          cfg.host,
          Number(process.env.DB_PORT || 3306),
          async (err, stream) => {
            if (err) {
              ssh.end();
              return reject(err);
            }

            try {
              const connection = await mysql.createConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: cfg.name,
                stream,
                connectTimeout: 300000,
              });

              connection.on('error', (err) => {
                console.log(`[DB] Error en conexión ${dbKey}:`, err.message);
                delete activeConnections[dbKey];
              });

              resolve({ ssh, connection });
            } catch (dbErr) {
              ssh.end();
              reject(dbErr);
            }
          }
        );
      })
      .on('error', (err) => {
        console.log(`[SSH] Error en ${dbKey}:`, err.message);
        reject(err);
      })
      .on('close', () => {
        delete activeConnections[dbKey];
        console.log(`[DB] Conexión cerrada: ${dbKey}`);
      })
      .connect({
        host: process.env.SSH_HOST,
        port: Number(process.env.SSH_PORT || 22),
        username: process.env.SSH_USER,
        privateKey,
        readyTimeout: 300000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 5,
      });
  });
}

async function query(dbKey, sql, params = []) {
  const conn = await connectDatabase(dbKey);
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function execute(dbKey, sql, params = []) {
  const conn = await connectDatabase(dbKey);
  const [result] = await conn.execute(sql, params);
  return result;
}

async function closeDatabase(dbKey) {
  const active = activeConnections[dbKey];
  if (!active) return;
  try { await active.connection.end(); } catch {}
  try { active.ssh.end(); } catch {}
  delete activeConnections[dbKey];
}

async function closeAllDatabases() {
  for (const key of Object.keys(activeConnections)) {
    await closeDatabase(key);
  }
}

module.exports = {
  connectDatabase,
  query,
  execute,
  closeDatabase,
  closeAllDatabases,
  getAvailableKeys,
};