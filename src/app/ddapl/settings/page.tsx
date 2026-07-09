'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, User, Bell, Building, Save, CheckCircle } from 'lucide-react'
import { DdaplLayout } from '@/components/DdaplLayout'

export default function SettingsDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Mock settings state
  const [settings, setSettings] = useState({
    name: 'DDAPL User',
    email: 'ddapl@example.com',
    companyName: 'Acme Corp Logistics',
    emailNotifications: true
  })

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'DDAPL' && role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [router])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API save
    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 800)
  }

  return (
    <DdaplLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-500" /> Account Settings
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <form onSubmit={handleSave} className="p-6 space-y-5">
            
            {/* Profile Section */}
            <section>
              <h3 className="text-base font-medium text-slate-800 dark:text-white mb-3 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-400" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Company Section */}
            <section>
              <h3 className="text-base font-medium text-slate-800 dark:text-white mb-3 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center">
                <Building className="w-4 h-4 mr-2 text-slate-400" /> Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section>
              <h3 className="text-base font-medium text-slate-800 dark:text-white mb-3 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-slate-400" /> Notifications
              </h3>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-slate-500 mt-0.5">Receive emails when customers accept or reject shipments.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </section>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center">
              {saved && <span className="text-emerald-600 mr-4 font-medium text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Saved successfully</span>}
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </DdaplLayout>
  )
}
