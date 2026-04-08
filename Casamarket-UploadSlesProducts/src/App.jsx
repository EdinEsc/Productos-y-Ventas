import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { DeleteProducts } from './pages/DeleteProducts'
import { DeleteSales } from './pages/DeleteSales'
import { LoginCard } from './components/LoginCard'

function App() {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/products/deletedProducts" replace />
              : <LoginCard onLogin={setUser} />
          }
        />

        <Route
          path="/*"
          element={
            !user
              ? <Navigate to="/login" replace />
              : (
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
                  <Sidebar
                    onLogout={() => setUser(null)}
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    setIsCollapsed={setSidebarCollapsed}
                  />
                  <Header
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                  <main
                    className={`${
                      sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                    } pt-[72px] p-6 transition-all`}
                  >
                    <Routes>
                      <Route path="/" element={<Navigate to="/products/deletedProducts" replace />} />
                      <Route path="/products/deletedProducts" element={<DeleteProducts user={user} />} />
                      <Route path="/sales/deletedSales" element={<DeleteSales user={user} />} />
                      <Route path="*" element={<Navigate to="/products/deletedProducts" replace />} />
                    </Routes>
                  </main>
                </div>
              )
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App