'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, LayoutDashboard, Users, Database, Sun, Moon, ShieldAlert } from 'lucide-react'
import { useTheme } from 'next-themes'

interface AdminLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export function AdminLayout({ children, fullWidth = false }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'System DB', path: '/admin/db', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300`}>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Admin Console</h1>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-2"
                title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 mr-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
              <span className="hidden sm:inline">Logged in as:</span>&nbsp;<span className="font-bold">Admin</span>
            </div>

            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors border-l border-slate-200 dark:border-slate-700 pl-4">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-700 transition-all duration-300`}>
          <nav className="flex space-x-1 sm:space-x-8 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
              
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className={`
                    whitespace-nowrap py-3 px-4 sm:px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200
                    ${isActive 
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 sm:mr-2 ${isActive ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className={`flex-1 ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}
