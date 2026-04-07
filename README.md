# Sistema de Limpieza de Productos y Ventas

Sistema completo para la **eliminación masiva, controlada y segura de datos** en bases de datos, incluyendo:

* Productos
* Ventas

El sistema está diseñado para entornos productivos donde se requiere **alto volumen de procesamiento**, seguridad y control de ejecución.

---

## Arquitectura del Proyecto

```
ELIMINACION DE PRODUCTOS
│
├── Casamarket-UploadSlesProducts   # Carga masiva
├── product cleaning1SP             # Limpieza de productos
├── sales cleaning1SP               # Limpieza de ventas
│
├── frontend                        # Interfaz React
├── .gitignore
├── README.md
```

---

## Backend (Microservicios)

###  1. Limpieza de Productos

Servicio encargado de eliminar información de productos.

**Características:**

* Limpieza en **11 tablas**
* Filtros:

  * `company_id`
  * `warehouse_id`
* Procesamiento por lotes
* Exclusión de registros protegidos (`flag_default`)
* Uso de `deleted_at` (soft delete)

---

###  2. Limpieza de Ventas

Servicio encargado de eliminar información de ventas.

**Características:**

* Limpieza en **15 tablas**
* Incluye:

  * documentos
  * órdenes
  * transacciones
  * movimientos de caja
* Procesamiento por lotes:

  * 5,000 registros
  * 10,000 registros
* Soft delete (`deleted_at`)

---

###  3. Carga Masiva (Casamarket)

* Procesamiento de archivos Excel / CSV
* Inserción masiva de datos
* Integración con APIs externas

---

##  Conexión a Base de Datos (SSH + MySQL)

Uno de los puntos más importantes del sistema.

###  ¿Cómo funciona?

El backend **NO se conecta directamente a la base de datos**.

En su lugar:

1. Se crea un **túnel SSH seguro**
2. Se redirige el tráfico hacia la base de datos
3. Se conecta MySQL a través de ese túnel

---

###  Flujo de conexión

```
Node.js
   ↓
SSH (ssh2)
   ↓
Túnel seguro
   ↓
MySQL (mysql2)
   ↓
Base de datos remota
```

---

###  Características técnicas

* Uso de la librería `ssh2`
* Autenticación con **clave privada (.pem)**
* Conexiones dinámicas por base de datos:

  * `db1`, `db2`, `db3`, `db4`, `db5`
* Reutilización de conexiones activas
* Manejo de múltiples conexiones simultáneas

---

###  Beneficios

*  Seguridad (no se expone la BD)
*  Acceso remoto seguro
*  Reutilización de conexiones
*  Escalable

---

###  Manejo de errores

* Reconexión automática si se pierde conexión
* Timeout extendido para procesos batch
* Logs detallados por conexión

---

##  Procesamiento Inteligente

###  Procesamiento por lotes (Batch)

* Evita sobrecarga de la base de datos
* Ejecuta múltiples ciclos hasta completar la limpieza

---

###  Reintentos automáticos

* Hasta **3 intentos**
* Manejo de errores como:

  * `Connection lost`
  * Timeout

---

###  Persistencia de estado

Se guarda el progreso en archivos:

```
cleanup-state-<db>_<company>.json
```

Permite:

* Reanudar procesos fallidos
* Consultar avance
* Evitar repetir tablas

---

##  Control de concurrencia

* Evita ejecutar múltiples procesos iguales
* Control basado en:

  * `db_target`
  * `company_id`

---

##  API Endpoints

###  Iniciar limpieza

```http
POST /api/limpiar
```

**Productos:**

```json
{
  "db_target": "db1",
  "company_id": 1,
  "warehouses": [1,2,3]
}
```

**Ventas:**

```json
{
  "db_target": "db1",
  "company_id": 1
}
```

---

###  Estado del proceso

```http
GET /api/limpiar/estado
```

---

###  Borrar estado

```http
DELETE /api/limpiar/estado
```

---

###  Test conexión

```http
GET /api/test-db/:dbKey
```

---

##  Frontend (React)

Interfaz desarrollada con:

* React + Vite
* TailwindCSS
* Lucide Icons

---

###  Login

* Autenticación con API externa (Casamarket)
* Obtiene:

  * Token
  * Employee
  * Warehouses
* Validación de rol:

  * Solo usuarios `SUPPORT`

---

###  Navegación

* Sidebar dinámico
* Módulos:

  * Productos
  * Ventas

---

###  Módulo Productos

* Selección automática de almacenes
* Eliminación por almacén
* Confirmación crítica
* Estado en tiempo real

---

###  Módulo Ventas

* Eliminación total por empresa
* Confirmación visual
* Seguimiento del proceso

---

###  Comunicación con Backend

Variables `.env`:

```env
VITE_APIPRODUCTS_URL=
VITE_APISALES_URL=
```

---

##  Flujo Completo

```
Frontend (React)
        ↓
Login (Casamarket)
        ↓
Selección de módulo
        ↓
API (Node.js)
        ↓
SSH → MySQL
        ↓
Proceso batch
        ↓
Estado guardado
        ↓
Frontend muestra progreso
```

---

##  Variables de entorno

### Backend

```env
DB1_HOST=
DB1_NAME=
DB_USER=
DB_PASSWORD=

SSH_HOST=
SSH_PORT=
SSH_USER=
SSH_KEY_PATH=
```

---

### Frontend

```env
VITE_APIPRODUCTS_URL=
VITE_APISALES_URL=
```

---

## Ejecución

### Backend

```bash
cd product cleaning1SP
npm install
npm run dev
```

```bash
cd sales cleaning1SP
npm install
npm run dev
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

##  Consideraciones

*  No se eliminan datos físicamente
*  Proceso irreversible
*  Seguro y controlado
*  Escalable

---

##  Buenas prácticas

* Arquitectura modular
* Uso de SSH seguro
* Manejo de errores
* Logs detallados
* Procesamiento eficiente

---

##  Autor

Sistema desarrollado para automatización de limpieza masiva de datos en entornos productivos.
