'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { Database, AlertCircle } from 'lucide-react'

export default function AdminDBPage() {
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Database className="w-6 h-6 mr-2 text-rose-500" />
            System Database Viewer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Direct read-only access to the underlying PostgreSQL tables.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Raw Data Viewer Coming Soon</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          This section is currently under construction. In a future update, this tab will allow administrators to directly query and view the raw data tables (Users, POs, Shipments, AuditLogs) for debugging purposes.
        </p>
      </div>
    </AdminLayout>
  )
}
