import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { DeleteProducts } from './pages/DeleteProducts'
import { DeleteSales } from './pages/DeleteSales'
import { Menu } from 'lucide-react'
import { useUserFromFrame } from './hooks/useUserFromFrame'

function App() {
  const { user, loading, error } = useUserFromFrame()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando aplicación...
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || 'No se pudo cargar el usuario'}
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-zinc-950 text-white">
        <ThemeToggle />

        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-zinc-900 p-2 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          user={user}
        />

        <main className={`${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} transition-all`}>
          <Routes>
            <Route path="/" element={<Navigate to="/products/deletedProducts" replace />} />
            <Route path="/products/deletedProducts" element={<DeleteProducts user={user} />} />
            <Route path="/sales/deletedSales" element={<DeleteSales user={user} />} />
            <Route path="*" element={<Navigate to="/products/deletedProducts" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App

