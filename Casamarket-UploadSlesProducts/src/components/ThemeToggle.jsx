import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-[#e0f5f5] hover:bg-[#cdeeed] dark:bg-gray-700 dark:hover:bg-gray-600 text-[#02979B] dark:text-white transition"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  )
}