'use client'

import { useState, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, CheckCircle, XCircle, Download, File, RefreshCw, ExternalLink, ChevronUp, ChevronDown, TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { StatusBadge } from '@/components/StatusBadge'
import { CustomerLayout } from '@/components/CustomerLayout'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type Shipment = {
  id: string
  poId: string
  shipmentNo: number
  invoicePdf: string | null
  podPdf: string | null
  status: string
  customerRemarks: string | null
  visibleToCustomer: boolean
}

type PO = {
  id: string
  poNumber: string
  poFile: string
  overallStatus: string
  shipments: Shipment[]
}

export function CustomerDashboardClient({ initialData, customerId }: { initialData: { pos: PO[], nextCursor: string | null, counts?: any }, customerId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Modal State
  const [rejectModalState, setRejectModalState] = useState<{isOpen: boolean, shipmentId: string, reason: string}>({
    isOpen: false,
    shipmentId: '',
    reason: ''
  })

  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ACTION_REQUIRED' | 'COMPLETED'>('ACTIVE')
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({})

  const togglePO = (poId: string) => {
    setExpandedPOs(prev => ({ ...prev, [poId]: !prev[poId] }))
  }

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loading 
  } = useInfiniteQuery({
    queryKey: ['customer-pos', activeTab, deferredSearch],
    queryFn: async ({ pageParam = null }) => {
      let url = pageParam ? `/api/pos?role=CUSTOMER&customerId=${customerId}&cursor=${pageParam}&tab=${activeTab}` : `/api/pos?role=CUSTOMER&customerId=${customerId}&tab=${activeTab}`
      if (deferredSearch) {
        url += `&search=${encodeURIComponent(deferredSearch)}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch POs')
      return res.json()
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: (deferredSearch || activeTab !== 'ACTIVE') ? undefined : {
      pages: [initialData],
      pageParams: [null],
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const displayPOs: PO[] = data?.pages.flatMap(page => page.pos) || (deferredSearch || activeTab !== 'ACTIVE' ? [] : initialData.pos)
  
  // Get counts from the latest page, fallback to 0 if not loaded
  const counts = data?.pages[0]?.counts || initialData.counts || { ACTIVE: 0, ACTION_REQUIRED: 0, COMPLETED: 0 }

  const { data: analytics } = useQuery({
    queryKey: ['analytics', customerId],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const handleAction = async (shipmentId: string, action: 'ACCEPTED') => {
    // Rejection is handled by handleRejectSubmit via the Modal
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action })
    })
    
    if (res.ok) queryClient.invalidateQueries({ queryKey: ['customer-pos'] })
  }

  const handleRejectSubmit = async () => {
    const { shipmentId, reason } = rejectModalState
    if (!reason || !shipmentId) return

    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', customerRemarks: reason })
    })
    
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['customer-pos'] })
      setRejectModalState({ isOpen: false, shipmentId: '', reason: '' })
    }
  }

  const actionToolbar = (
    <div className="flex items-center gap-3 h-9">
      <div className="h-full inline-flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          Active ({counts.ACTIVE})
        </button>
        <button 
          onClick={() => setActiveTab('ACTION_REQUIRED')}
          className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'ACTION_REQUIRED' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          Action Required ({counts.ACTION_REQUIRED})
        </button>
        <button 
          onClick={() => setActiveTab('COMPLETED')}
          className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          Completed ({counts.COMPLETED})
        </button>
      </div>
    </div>
  )

  return (
    <CustomerLayout onSearch={setSearchQuery} actionToolbar={actionToolbar} fullWidth={true}>
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Side Pane: Analytics */}
        {analytics && (
          <div className="w-full lg:w-48 flex-shrink-0">
            <div className="sticky top-6">
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Overview</h2>
              <div className="flex flex-col gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mr-3 flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.activePOs}</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Active POs</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-3 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.actionRequiredPOs}</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Action Required</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mr-3 flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.rejectionRate}%</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Rejection Rate</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-3 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.avgCompletionDays} <span className="text-[10px] font-medium text-slate-500">days</span></h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Avg Completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="space-y-4">
        {displayPOs.map(po => {
            const visibleShipments = po.shipments.filter(s => s.visibleToCustomer)
            
            return (
              <div key={po.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{po.poNumber}</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold text-teal-600 dark:text-teal-400">{po.overallStatus.replace(/_/g, ' ')}</span></p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <a 
                      href={`/api/files?path=${encodeURIComponent(po.poFile)}&view=true`}
                      target="_blank"
                      className="text-sm font-medium text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-white bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> View PO
                    </a>
                    <a 
                      href={`/api/pos/${po.id}/download`}
                      download
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Entire PO
                    </a>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={() => togglePO(po.id)} className="text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors flex items-center">
                      {expandedPOs[po.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {expandedPOs[po.id] && (
                <div className="p-6">
                  {visibleShipments.length === 0 ? (
                    <p className="text-slate-400 text-sm italic py-4">No shipments visible for this PO yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-3">Shipment No.</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Documents</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                          {visibleShipments.map(shipment => (
                            <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-800 dark:text-white">
                                Shipment {shipment.shipmentNo}
                              </td>
                              <td className="px-6 py-3">
                                <StatusBadge status={shipment.status} />
                                {shipment.status === 'REJECTED' && shipment.customerRemarks && (
                                  <p className="mt-2 text-xs text-red-600 font-medium truncate max-w-[200px]" title={shipment.customerRemarks}>Reason: {shipment.customerRemarks}</p>
                                )}
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex flex-col gap-2">
                                  {shipment.invoicePdf && (
                                    <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm">
                                      <File className="w-4 h-4 mr-1.5" /> Invoice <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
                                    </a>
                                  )}
                                  {shipment.podPdf && (
                                    <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm">
                                      <File className="w-4 h-4 mr-1.5" /> POD <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {shipment.status === 'WAITING_APPROVAL' && (
                                    <>
                                      <button 
                                        onClick={() => handleAction(shipment.id, 'ACCEPTED')}
                                        className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors text-xs"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept
                                      </button>
                                      <button 
                                        onClick={() => setRejectModalState({ isOpen: true, shipmentId: shipment.id, reason: '' })}
                                        className="flex items-center bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-3 py-1.5 rounded-md font-medium transition-colors text-xs"
                                      >
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                                      </button>
                                    </>
                                  )}
                                  <a 
                                    href={`/api/shipments/${shipment.id}/download`}
                                    download
                                    className="flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md font-medium transition-colors text-xs"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                )}
              </div>
            )
          })}
          {displayPOs.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 border-dashed">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                {searchQuery ? `No ${activeTab === 'ACTIVE' ? 'Active' : activeTab === 'ACTION_REQUIRED' ? 'Action Required' : 'Completed'} Purchase Orders match your search` : `No ${activeTab === 'ACTIVE' ? 'Active' : activeTab === 'ACTION_REQUIRED' ? 'Action Required' : 'Completed'} Purchase Orders yet`}
              </h3>
              <p className="text-slate-500 mt-1">
                {searchQuery ? 'Try adjusting your search terms.' : activeTab === 'ACTIVE' ? 'Waiting for DDAPL to create new POs.' : activeTab === 'ACTION_REQUIRED' ? 'POs needing your approval will appear here.' : 'Completed POs will appear here.'}
              </p>
            </div>
          )}
        </div>
        
        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
      </div>

      {/* Reject Shipment Modal */}
      <Modal isOpen={rejectModalState.isOpen} onClose={() => setRejectModalState(prev => ({...prev, isOpen: false}))} title="Reject Shipment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
            <textarea 
              value={rejectModalState.reason}
              onChange={(e) => setRejectModalState(prev => ({...prev, reason: e.target.value}))}
              placeholder="Please explain why you are rejecting this shipment..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 min-h-[100px]"
            />
          </div>
          <div className="flex justify-end pt-4 gap-3">
            <button onClick={() => setRejectModalState(prev => ({...prev, isOpen: false}))} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleRejectSubmit} disabled={!rejectModalState.reason.trim()} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </CustomerLayout>
  )
}
