# Servicio de Limpieza de Ventas

Servicio Node.js + Express para limpiar datos de ventas por empresa y nodo de base de datos.

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de ejemplo y llénalo con tus datos reales:
```bash
cp .env.example .env
```

2. Edita el `.env` con los datos de conexión de cada nodo y un token secreto.

## Iniciar el servicio

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

## Uso del endpoint

### POST /api/limpiar-ventas

**Headers:**
```
Authorization: Bearer mi_token_super_secreto
Content-Type: application/json
```

**Body:**
```json
{
  "company_id": 4036,
  "nodo": "n4"
}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Limpieza completada exitosamente",
  "resumen": {
    "company_id": 4036,
    "nodo": "n4",
    "totalFilasAfectadas": 150,
    "totalTablas": 15,
    "tablasConError": 0
  },
  "detalle": [
    { "tabla": "Cajas - balance en vacío", "ok": true, "filasAfectadas": 2 },
    { "tabla": "Series - reinicia correlativo a 0", "ok": true, "filasAfectadas": 5 },
    ...
  ]
}
```

## Nodos válidos
- n1, n2, n3, n4, n5

## Seguridad
- Solo usuarios con el token correcto pueden ejecutar la limpieza
- El token va en el header `Authorization: Bearer <token>`
