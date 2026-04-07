import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginCard } from './components/LoginCard'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { DeleteProducts } from './pages/DeleteProducts'
import { DeleteSales } from './pages/DeleteSales'
import { Menu } from 'lucide-react'

function App() {
  const [authData, setAuthData] = useState(() => {
    const stored = localStorage.getItem('credentials')
    return stored ? JSON.parse(stored) : null
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isLogged = !!authData?.token

  function handleLogin(data) {
    localStorage.setItem('credentials', JSON.stringify(data))
    setAuthData(data)
  }

  async function handleLogout() {
    try {
      if (authData?.token) {
        await fetch('https://acl.casamarketapp.com/api/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: 'Gracias por visitarnos.' }),
        })
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      localStorage.removeItem('credentials')
      setAuthData(null)
    }
  }

  return (
    <HashRouter>
      {!isLogged ? (
        <Routes>
          <Route path="/" element={<LoginCard onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
          <Sidebar
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            isCollapsed={sidebarCollapsed}
            setIsCollapsed={setSidebarCollapsed}
          />

          <div
            className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
              sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
            }`}
          >
            <header className="sticky top-0 z-30 h-[72px] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex h-full items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Panel de soporte
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden md:block text-sm text-gray-600 dark:text-gray-300 max-w-[220px] truncate">
                    {authData?.employee?.email ?? authData?.codeUser}
                  </span>

                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-4 sm:p-6 text-gray-900 dark:text-gray-100">
              <Routes>
                <Route
                  path="/products/deletedProducts"
                  element={<DeleteProducts authData={authData} />}
                />
                <Route
                  path="/sales/deletedSales"
                  element={<DeleteSales authData={authData} />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/products/deletedProducts" replace />}
                />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </HashRouter>
  )
}

export default App