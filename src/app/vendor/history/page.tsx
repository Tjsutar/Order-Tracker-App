'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, RefreshCw, Archive, Filter } from 'lucide-react'
import { VendorLayout } from '@/components/VendorLayout'

type PO = {
  id: string
  poNumber: string
  overallStatus: string
  uploadDate: string
}

export default function HistoryDashboard() {
  const router = useRouter()
  const [historyPOs, setHistoryPOs] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'VENDOR' && role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchHistory()
  }, [router])

  const fetchHistory = async () => {
    try {
      // For MVP, just fetch all and filter client side. In prod, use ?status=COMPLETED
      const res = await fetch('/api/pos')
      if (res.ok) {
        const data = await res.json()
        const archived = data.filter((po: PO) => po.overallStatus === 'COMPLETED' || po.overallStatus === 'REJECTED')
        setHistoryPOs(archived)
      }
    } catch (error) {
      console.error('Failed to fetch POs', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = historyPOs.filter(po => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return po.poNumber.toLowerCase().includes(q) || po.overallStatus.toLowerCase().includes(q);
  })

  return (
    <VendorLayout onSearch={setSearchQuery}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Archive className="w-6 h-6 mr-3 text-indigo-500" /> Archival History
          </h2>
          <button className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-20">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No history found</h3>
              <p className="text-slate-500 mt-1">Completed and Rejected Purchase Orders will appear here.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Final Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredHistory.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(po.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{po.poNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${po.overallStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {po.overallStatus.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </VendorLayout>
  )
}
