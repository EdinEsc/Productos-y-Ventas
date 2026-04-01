const fs = require('fs');
const path = require('path');

function stateFilePath(key) {
  return path.join(__dirname, '..', `cleanup-state-${key}.json`);
}

function leerEstado(key) {
  try {
    const file = stateFilePath(key);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function guardarEstado(key, estado) {
  try {
    fs.writeFileSync(stateFilePath(key), JSON.stringify(estado, null, 2), 'utf8');
  } catch (err) {
    console.error('[STATE] Error guardando estado:', err.message);
  }
}

function borrarEstado(key) {
  try {
    const file = stateFilePath(key);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
}

module.exports = { leerEstado, guardarEstado, borrarEstado };
