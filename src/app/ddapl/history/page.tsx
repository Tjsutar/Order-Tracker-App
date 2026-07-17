'use client'

import React, { useState, useRef, useEffect, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, RefreshCw, Archive, Filter, ChevronDown, ChevronUp, CheckCircle, ExternalLink } from 'lucide-react'
import { DdaplLayout } from '@/components/DdaplLayout'
import { useInfiniteQuery } from '@tanstack/react-query'

type Shipment = {
  id: string
  shipmentNo: string
  status: string
  invoicePdf: string | null
  podPdf: string | null
}

type PO = {
  id: string
  poNumber: string
  overallStatus: string
  uploadDate: string
  pdfPath: string
  shipments: Shipment[]
}

export default function HistoryDashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ACTION_REQUIRED'>('ALL')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [expandedPO, setExpandedPO] = useState<string | null>(null)
  
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loading 
  } = useInfiniteQuery({
    queryKey: ['ddapl-history', statusFilter, deferredSearch],
    queryFn: async ({ pageParam = null }) => {
      let url = `/api/pos?role=DDAPL&tab=HISTORY`
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`
      if (deferredSearch) url += `&search=${encodeURIComponent(deferredSearch)}`
      if (pageParam) url += `&cursor=${pageParam}`
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch POs')
      return res.json()
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const displayPOs: PO[] = data?.pages.flatMap(page => page.pos) || []

  const actionToolbar = (
    <div className="relative h-9 flex items-center" ref={filterRef}>
      <button 
        onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
        className="h-full flex items-center text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 rounded-md transition-colors shadow-sm"
      >
        <Filter className="w-4 h-4 mr-2" /> 
        {statusFilter === 'ALL' ? 'All Statuses' : statusFilter === 'COMPLETED' ? 'Completed' : 'Rejected'}
        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
      </button>
      {showFilterDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-10 py-1">
          <button onClick={() => { setStatusFilter('ALL'); setShowFilterDropdown(false); }} className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === 'ALL' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>All Statuses</button>
          <button onClick={() => { setStatusFilter('COMPLETED'); setShowFilterDropdown(false); }} className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === 'COMPLETED' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Completed</button>
          <button onClick={() => { setStatusFilter('ACTION_REQUIRED'); setShowFilterDropdown(false); }} className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === 'ACTION_REQUIRED' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Rejected</button>
        </div>
      )}
    </div>
  )

  return (
    <DdaplLayout onSearch={setSearchQuery} actionToolbar={actionToolbar} fullWidth={true}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="w-full">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {displayPOs.length === 0 ? (
              <div className="text-center py-20">
                <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  {searchQuery ? 'No history matches your search' : 'No history found'}
                </h3>
                <p className="text-slate-500 mt-1">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Completed and Rejected Purchase Orders will appear here.'}
                </p>
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
                  {displayPOs.map((po) => (
                    <React.Fragment key={po.id}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${expandedPO === po.id ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`}>
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
                            ${po.overallStatus === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {po.overallStatus.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            {expandedPO === po.id ? 'Hide Details' : 'View Details'}
                            {expandedPO === po.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                          </button>
                        </td>
                      </tr>
                      {expandedPO === po.id && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <div className="mb-4 flex justify-between items-center">
                              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Shipments for PO {po.poNumber}</h4>
                              {po.pdfPath && (
                                <a href={`/api/files?path=${encodeURIComponent(po.pdfPath)}&view=true`} target="_blank" className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors shadow-sm">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Original PO
                                </a>
                              )}
                            </div>
                            {po.shipments && po.shipments.length > 0 ? (
                              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                                <table className="min-w-full text-sm text-left">
                                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                      <th className="px-4 py-3">Shipment No.</th>
                                      <th className="px-4 py-3">Status</th>
                                      <th className="px-4 py-3">Documents</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {po.shipments.map(shipment => (
                                      <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">Shipment {shipment.shipmentNo}</td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                            ${shipment.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                              shipment.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                              'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {shipment.status.replace(/_/g, ' ').toLowerCase()}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            {shipment.invoicePdf && (
                                              <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center transition-colors text-xs" title="View Invoice">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Invoice
                                              </a>
                                            )}
                                            {shipment.podPdf && (
                                              <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center transition-colors text-xs" title="View POD">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> POD
                                              </a>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 py-4 text-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">No shipments recorded for this PO.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isFetchingNextPage ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading more...</>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </DdaplLayout>
  )
}
