import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { getDbTarget } from '../lib/getDbTarget'

const APIPRODUCTS_URL = import.meta.env.VITE_APIPRODUCTS_URL

export function DeleteProducts({ authData }) {
  const companyId = authData?.employee?.companyId
  const warehouses = authData?.warehouses ?? []
  const dbTarget = getDbTarget(authData?.domains)

  const [selectedWarehouses, setSelectedWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const intervalRef = useRef(null)

  useEffect(() => {
    setSelectedWarehouses(warehouses.map((w) => w.id))
  }, [warehouses])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  function showToast(message, type = 'error') {
    const bg =
      type === 'success'
        ? 'bg-green-600'
        : type === 'warning'
        ? 'bg-yellow-500'
        : 'bg-red-500'

    const toast = document.createElement('div')
    toast.className = `fixed top-5 right-5 z-[100] px-4 py-3 rounded-lg text-white shadow-lg ${bg}`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  async function pollEstado() {
    try {
      const res = await fetch(
       `${APIPRODUCTS_URL}/api/limpiar/estado?db_target=${dbTarget}&company_id=${companyId}&warehouses=${selectedWarehouses.join(',')}`
      )

      const data = await res.json()
      setEstado(data)

      if (!data.procesoActivo) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setLoading(false)
        showToast('Proceso terminado', 'success')
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function handleConfirmar() {
    setShowConfirm(false)

    try {
      setLoading(true)
      setEstado(null)

      const res = await fetch(`${APIPRODUCTS_URL}/api/limpiar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db_target: dbTarget,
          company_id: companyId,
          warehouses: selectedWarehouses,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.message ?? 'Error al iniciar proceso')
        setLoading(false)
        return
      }

      showToast('Proceso iniciado', 'warning')

      intervalRef.current = setInterval(() => {
        pollEstado()
      }, 3000)
    } catch (error) {
      console.error(error)
      setLoading(false)
      showToast('Error de conexión con el servidor')
    }
  }

  function handleEliminar() {
    if (selectedWarehouses.length === 0) {
      showToast('No hay almacenes disponibles')
      return
    }

    setShowConfirm(true)
  }

  return (
    <div className="w-full">
      {showConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-500 bg-white p-8 shadow-2xl dark:bg-gray-800">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ¿Estás seguro?
              </h2>

              <p className="text-gray-600 dark:text-gray-300">
                Esta acción eliminará toda la información relacionada con productos
                de la empresa{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  #{companyId}
                </span>.
              </p>

              <div className="w-full rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Una vez iniciado el proceso no hay marcha atrás.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmar}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
              <Trash2 className="h-6 w-6 text-red-500" />
              Eliminar productos
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Gestiona la limpieza completa de información de productos por almacén.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Company ID:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {companyId}
              </span>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Nodo:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {dbTarget}
              </span>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Seleccionados:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedWarehouses.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Almacenes disponibles
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Los almacenes incluidos se procesarán automáticamente en la limpieza.
                </p>
              </div>

              <div className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {selectedWarehouses.length} seleccionados
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid gap-3">
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-4 rounded-2xl border border-blue-500 bg-blue-50/70 px-4 py-4 dark:border-blue-500 dark:bg-blue-900/20"
                >
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    disabled
                    className="h-5 w-5 shrink-0 cursor-not-allowed"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {w.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Incluido automáticamente en la limpieza
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-600 dark:text-gray-300">
                    ID: {w.id}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Acción crítica
                  </p>
                  <p className="mt-1 text-sm text-red-600/90 dark:text-red-300">
                    Esta operación elimina información relacionada con productos y no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleEliminar}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-4 text-base font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  Iniciar eliminación
                </>
              )}
            </button>

            {estado && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Estado del proceso
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      estado.procesoActivo
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {estado.procesoActivo ? 'En progreso' : 'Terminado'}
                  </span>
                </div>

                {estado.avance?.tabla_actual && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    Tabla actual:{' '}
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {estado.avance.tabla_actual}
                    </span>
                  </p>
                )}

                {estado.avance?.tablas_completadas?.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Completadas: {estado.avance.tablas_completadas.length}
                  </p>
                )}

                {estado.avance?.error && (
                  <p className="mt-3 text-sm font-medium text-red-500">
                    Error: {estado.avance.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}