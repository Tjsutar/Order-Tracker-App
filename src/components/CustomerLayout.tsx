'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Home, History, Settings, Search, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function CustomerLayout({ children, onSearch }: { children: React.ReactNode, onSearch?: (query: string) => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  const navItems = [
    { label: 'Dashboard', path: '/customer', icon: Home },
    { label: 'History', path: '/customer/history', icon: History },
    { label: 'Settings', path: '/customer/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col">
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xl">C</div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Customer Portal</h1>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 w-full max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700/50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-slate-900 dark:text-white"
              placeholder="Search POs, Shipments..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-2"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors border-l border-slate-200 dark:border-slate-700 pl-4">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-700 transition-all duration-300">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className={`
                    flex items-center whitespace-nowrap py-4 px-1 border-b-[3px] font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-teal-500' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
