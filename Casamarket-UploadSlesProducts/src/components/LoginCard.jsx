import { useState, useId } from "react"
import { getDomain } from '../lib/getDomain'

export function LoginCard({ onLogin }) {
  const id = useId()
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(text, type = "error") {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function getAuthCmToken() {
    try {
      setLoading(true)

      const authReq = await fetch("https://acl.casamarketapp.com/api/authenticate", {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          email: user,
          password: pass,
          codeApp: "quipuadmin",
        }),
        method: "POST",
      })

      if (!authReq.ok) {
        const errorRes = await authReq.json()
        showToast(errorRes.message ?? "Error al iniciar sesión")
        return
      }

      const authData = await authReq.json()

      const salesUrl = getDomain(authData.domains, "SALES_URL")
      if (!salesUrl) {
        showToast("No se encontró el servidor de ventas")
        return
      }

      const employeeReq = await fetch(`${salesUrl}/employees/current`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
      })

      if (!employeeReq.ok) {
        showToast("Error al obtener datos del empleado")
        return
      }

      const employeeData = await employeeReq.json()

      if (employeeData.roleCode !== "SUPPORT") {
        showToast("No tienes permiso para acceder")
        return
      }

      const productsUrl = getDomain(authData.domains, "PRODUCTS_URL")
      const warehousesReq = await fetch(`${productsUrl}/warehouses`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
      })

      if (!warehousesReq.ok) {
        showToast("Error al obtener almacenes")
        return
      }

      const warehousesData = await warehousesReq.json()

      onLogin({
        ...authData,
        loginEmail: user,
        employee: employeeData,
        warehouses: warehousesData,
      })
    } catch (error) {
      console.error(error)
      showToast("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex items-center justify-center px-4">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-white text-sm shadow-lg transition-all ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-8">
          <img
            src="https://admin.casamarket.la/static/img/logo-casamarket.svg"
            alt="Casamarket Logo"
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`email-${id}`}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email
            </label>
            <input
              id={`email-${id}`}
              type="email"
              placeholder="m@example.com"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`password-${id}`}
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Contraseña
            </label>
            <input
              id={`password-${id}`}
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          <button
            onClick={getAuthCmToken}
            disabled={loading}
            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}