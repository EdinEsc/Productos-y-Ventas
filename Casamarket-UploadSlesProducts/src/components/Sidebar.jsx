import { useState } from 'react'
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  SquareTerminal,
  Star,
  X,
} from 'lucide-react'

const navMain = [
  {
    title: 'Productos',
    icon: SquareTerminal,
    items: [
      { title: 'Eliminar Productos', url: '/#/products/deletedProducts' },
    ],
  },
  {
    title: 'Ventas',
    icon: Star,
    items: [
      { title: 'Eliminar Ventas', url: '/#/sales/deletedSales' },
    ],
  },
]

export function Sidebar({
  onLogout,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}) {
  const [open, setOpen] = useState({})

  function toggle(title) {
    if (isCollapsed) return
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          shadow-md
          transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="h-[72px] border-b border-gray-200 dark:border-gray-700">
            <div
              className={`flex h-full items-center px-4 ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              {!isCollapsed && (
                <img
                  src="https://admin.casamarket.la/static/img/logo-casamarket.svg"
                  alt="Logo"
                  className="w-36"
                />
              )}

              {isCollapsed && (
                <div className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg bg-[#e0f5f5] dark:bg-[#014f52] text-[#02979B] dark:text-[#D7EB87] font-bold">
                  C
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-[#e0f5f5] dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  className="hidden lg:inline-flex items-center justify-center rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-[#e0f5f5] dark:hover:bg-gray-700"
                >
                  {isCollapsed ? (
                    <ChevronsRight className="h-5 w-5" />
                  ) : (
                    <ChevronsLeft className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            {navMain.map((item) => {
              const Icon = item.icon
              const isExpanded = open[item.title]

              return (
                <div key={item.title} className="mb-2">
                  <button
                    onClick={() => toggle(item.title)}
                    className={`w-full flex items-center rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-[#e0f5f5] dark:hover:bg-gray-700 transition ${
                      isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
                    }`}
                    title={isCollapsed ? item.title : ''}
                  >
                    <Icon className="h-5 w-5 shrink-0" />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!isCollapsed && isExpanded && (
                    <div className="ml-9 mt-1 flex flex-col gap-1">
                      {item.items.map((sub) => (
                        <a
                          key={sub.title}
                          href={sub.url}
                          onClick={() => setIsOpen(false)}
                          className="px-3 py-2 rounded-lg text-sm text-[#4a6000] bg-[#D7EB87] hover:brightness-95 dark:bg-[#5f6f1f] dark:text-[#eef7c6] transition"
                        >
                          {sub.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onLogout}
              className={`w-full flex items-center rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition ${
                isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
              }`}
              title={isCollapsed ? 'Cerrar sesión' : ''}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}