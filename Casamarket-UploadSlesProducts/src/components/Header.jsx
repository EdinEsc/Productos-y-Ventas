import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header({ user, onMenuClick, sidebarCollapsed }) {
  return (
    <header
      className={`fixed top-0 right-0 z-30 h-[72px] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
      } left-0`}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-[#e0f5f5] dark:hover:bg-gray-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
          {user?.loginEmail ?? user?.employee?.email ?? ''}
        </span>
        <ThemeToggle />
      </div>
    </header>
  )
}