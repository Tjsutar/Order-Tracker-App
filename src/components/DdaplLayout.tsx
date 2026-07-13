'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, LogOut, Home, History, Settings, Smartphone, Trash2, Sun, Moon, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState as useReactState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useDebounce } from '@/hooks/useDebounce'

export function DdaplLayout({ children, onSearch, onOpenTrash, fullWidth = false, actionToolbar }: { children: React.ReactNode, onSearch?: (query: string) => void, onOpenTrash?: () => void, fullWidth?: boolean, actionToolbar?: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const [mounted, setMounted] = useReactState(false)

  const { data: session, status } = useSession()
  const debouncedSearch = useDebounce(searchQuery, 400)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch)
    }
  }, [debouncedSearch, onSearch])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const navItems = [
    { label: 'Dashboard', path: '/ddapl', icon: Home },
    { label: 'History', path: '/ddapl/history', icon: History },
    { label: 'Settings', path: '/ddapl/settings', icon: Settings },
  ]

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans flex flex-col">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 flex-shrink-0">
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300`}>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Order Tracker</h1>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 w-full max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700/50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900 dark:text-white"
              placeholder="Search POs, Invoices, Shipments..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            {onOpenTrash && (
              <button 
                onClick={onOpenTrash}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors mr-2"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Trash Bin
              </button>
            )}
            
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-2"
                title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 mr-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="hidden sm:inline">Logged in as:</span>&nbsp;<span className="font-bold">DDAPL</span>
            </div>

            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors border-l border-slate-200 dark:border-slate-700 pl-4">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-700 transition-all duration-300`}>
          <div className="flex justify-between items-end">
            <nav className="flex space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden" aria-label="Tabs">
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
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            {actionToolbar && (
              <div className="flex items-center gap-3 py-2 self-center">
                {actionToolbar}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto w-full ${fullWidth ? '' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}
