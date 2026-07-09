'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { LayoutDashboard, ShieldAlert } from 'lucide-react'

export default function AdminOverviewPage() {
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2 text-rose-500" />
            System Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">High-level metrics for the Order Tracker platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">Active</p>
          <div className="mt-2 text-sm text-rose-600 dark:text-rose-400 flex items-center">
            Go to Users tab to manage accounts.
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">System Status</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Healthy</p>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
            Database connection stable.
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Platform Version</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">v1.2.0</p>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
            MVP Release
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Admin Control Center</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Welcome to the Admin portal. Use the tabs above to manage system users or view raw database records.
        </p>
      </div>
    </AdminLayout>
  )
}
