'use client'

import { useState, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, CheckCircle, Eye, EyeOff, UploadCloud, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, Download, TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react'
import { DdaplLayout } from '@/components/DdaplLayout'
import { StatusBadge } from '@/components/StatusBadge'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadPOModal } from '@/components/ddapl/UploadPOModal'
import { UploadDocumentModal } from '@/components/ddapl/UploadDocumentModal'
import { TrashBinModal } from '@/components/ddapl/TrashBinModal'
import { ConfirmModal } from '@/components/ConfirmModal'

type Shipment = {
  id: string
  poId: string
  shipmentNo: number
  invoiceNo: string | null
  invoicePdf: string | null
  podPdf: string | null
  status: string
  customerRemarks: string | null
  visibleToCustomer: boolean
}

export type PO = {
  id: string
  poNumber: string
  customerId: string
  poFile: string
  overallStatus: string
  shipments: Shipment[]
}

export function DdaplDashboardClient({ initialData }: { initialData: { pos: PO[], nextCursor: string | null, counts?: any } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ACTION_REQUIRED' | 'COMPLETED'>('ACTIVE')

  // Modal States
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false)
  const [uploadModalState, setUploadModalState] = useState<{isOpen: boolean, shipmentId: string, type: 'invoicePdf' | 'podPdf' | null, files: File[]}>({
    isOpen: false,
    shipmentId: '',
    type: null,
    files: []
  })
  
  // Accordion State
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({})

  const togglePO = (poId: string) => {
    setExpandedPOs(prev => ({...prev, [poId]: !prev[poId]}))
  }
  
  // Trash Modal State
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false)

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loading 
  } = useInfiniteQuery({
    queryKey: ['pos', activeTab, deferredSearch],
    queryFn: async ({ pageParam = null }) => {
      let url = pageParam ? `/api/pos?cursor=${pageParam}&tab=${activeTab}` : `/api/pos?tab=${activeTab}`
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
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const addShipmentMutation = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId })
      })
      if (!res.ok) throw new Error('Failed to add shipment')
      return res.json()
    },
    onSuccess: (data, variables) => {
      setExpandedPOs(prev => ({...prev, [variables]: true}))
      queryClient.invalidateQueries({ queryKey: ['pos'] })
    }
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (shipment: Shipment) => {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleToCustomer: !shipment.visibleToCustomer })
      })
      if (!res.ok) throw new Error('Failed to toggle visibility')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pos'] })
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ shipmentId, type }: { shipmentId: string, type: 'invoicePdf' | 'podPdf' }) => {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: null })
      })
      if (!res.ok) throw new Error('Failed to delete document')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pos'] })
  })

  const deletePOMutation = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(`/api/pos/${poId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete PO')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pos'] })
  })

  const deleteShipmentMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const res = await fetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete shipment')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pos'] })
  })

  const handleDeleteDocument = (shipmentId: string, type: 'invoicePdf' | 'podPdf') => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Document',
      message: 'Are you sure you want to remove this document?',
      onConfirm: () => deleteDocumentMutation.mutate({ shipmentId, type })
    })
  }

  const handleDeletePO = (poId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Purchase Order',
      message: 'Are you sure you want to delete this entire PO? This will permanently delete all associated shipments as well.',
      onConfirm: () => deletePOMutation.mutate(poId)
    })
  }

  const handleDeleteShipment = (shipmentId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Shipment',
      message: 'Are you sure you want to move this shipment to the trash?',
      onConfirm: () => deleteShipmentMutation.mutate(shipmentId)
    })
  }

  const actionToolbar = (
    <div className="flex items-center gap-3 h-9">
      <div className="h-full inline-flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('ACTIVE')} className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Active ({counts.ACTIVE})
        </button>
        <button onClick={() => setActiveTab('ACTION_REQUIRED')} className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'ACTION_REQUIRED' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Action Required ({counts.ACTION_REQUIRED})
        </button>
        <button onClick={() => setActiveTab('COMPLETED')} className={`h-full flex items-center justify-center px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'COMPLETED' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Completed ({counts.COMPLETED})
        </button>
      </div>
      <button 
        onClick={() => setIsCreatePOModalOpen(true)}
        className="h-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4 mr-1.5" /> New PO
      </button>
    </div>
  )

  return (
    <DdaplLayout 
      onSearch={setSearchQuery} 
      onOpenTrash={() => setIsTrashModalOpen(true)}
      actionToolbar={actionToolbar}
      fullWidth={true}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Side Pane: Analytics */}
        {analytics && (
          <div className="w-full lg:w-48 flex-shrink-0">
            <div className="sticky top-6">
              <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Overview</h2>
              <div className="flex flex-col gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3 flex-shrink-0">
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

        {/* Right Side: PO List */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
          {displayPOs.map(po => (
            <div key={po.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{po.poNumber}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{po.overallStatus.replace(/_/g, ' ')}</span></p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={() => handleDeletePO(po.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors" title="Delete PO">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a href={`/api/files?path=${encodeURIComponent(po.poFile)}&view=true`} target="_blank" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors flex items-center">
                    <ExternalLink className="w-4 h-4 mr-1.5" /> View PO
                  </a>
                  <a 
                    href={`/api/pos/${po.id}/download`}
                    download
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PO
                  </a>
                  <button onClick={() => addShipmentMutation.mutate(po.id)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-1.5" /> Add Shipment
                  </button>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button onClick={() => togglePO(po.id)} className="text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors flex items-center">
                    {expandedPOs[po.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {expandedPOs[po.id] && (
              <div className="p-6">
                {po.shipments.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No shipments added yet. Add one to start the workflow.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3">Shipment No.</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Invoice</th>
                          <th className="px-6 py-3">POD</th>
                          <th className="px-6 py-3">Visibility</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                        {po.shipments.map(shipment => (
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
                              {shipment.invoicePdf ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/60 rounded-md transition-colors shadow-sm w-fit">
                                  <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="text-emerald-700 dark:text-emerald-300 flex items-center font-medium text-sm" title="View Document">
                                    <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span className="truncate max-w-[120px]">{shipment.invoicePdf.split(/[/\\]/).pop()}</span>
                                  </a>
                                  <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800/60 mx-1"></div>
                                  <button onClick={() => handleDeleteDocument(shipment.id, 'invoicePdf')} className="text-emerald-400 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete Document">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setUploadModalState({ isOpen: true, shipmentId: shipment.id, type: 'invoicePdf', files: [] })} className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm"><UploadCloud className="w-4 h-4 mr-1.5" /> Upload</button>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              {shipment.podPdf ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/60 rounded-md transition-colors shadow-sm w-fit">
                                  <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="text-emerald-700 dark:text-emerald-300 flex items-center font-medium text-sm" title="View Document">
                                    <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span className="truncate max-w-[120px]">{shipment.podPdf.split(/[/\\]/).pop()}</span>
                                  </a>
                                  <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800/60 mx-1"></div>
                                  <button onClick={() => handleDeleteDocument(shipment.id, 'podPdf')} className="text-emerald-400 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete Document">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setUploadModalState({ isOpen: true, shipmentId: shipment.id, type: 'podPdf', files: [] })} className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm"><UploadCloud className="w-4 h-4 mr-1.5" /> Upload</button>
                              )}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <button
                                onClick={() => toggleVisibilityMutation.mutate(shipment)}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm border ${shipment.visibleToCustomer ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/50' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                                title={shipment.visibleToCustomer ? "Click to hide from Customer" : "Click to show to Customer"}
                              >
                                {shipment.visibleToCustomer ? (
                                  <><Eye className="w-3.5 h-3.5 mr-1.5" /> Visible</>
                                ) : (
                                  <><EyeOff className="w-3.5 h-3.5 mr-1.5" /> Hidden</>
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(shipment.invoicePdf || shipment.podPdf) && (
                                  <a 
                                    href={`/api/shipments/${shipment.id}/download`}
                                    download
                                    className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 transition-colors shadow-sm"
                                    title="Download Documents"
                                  >
                                    <Download className="w-4 h-4 mr-1.5" /> Download
                                  </a>
                                )}
                                <button 
                                  onClick={() => handleDeleteShipment(shipment.id)}
                                  className="inline-flex items-center text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 shadow-sm"
                                  title="Delete Shipment"
                                >
                                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                                </button>
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
          ))}
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
        
        {displayPOs.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 border-dashed">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              {searchQuery ? `No ${activeTab === 'ACTIVE' ? 'Active' : activeTab === 'ACTION_REQUIRED' ? 'Action Required' : 'Completed'} Purchase Orders match your search` : `No ${activeTab === 'ACTIVE' ? 'Active' : activeTab === 'ACTION_REQUIRED' ? 'Action Required' : 'Completed'} Purchase Orders yet`}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {searchQuery ? 'Try adjusting your search terms.' : activeTab === 'ACTIVE' ? 'Get started by creating a new PO.' : activeTab === 'ACTION_REQUIRED' ? 'POs needing your attention will appear here.' : 'Completed POs will appear here.'}
            </p>
          </div>
        )}
        </div>
      </div>

      <UploadPOModal 
        isOpen={isCreatePOModalOpen} 
        onClose={() => setIsCreatePOModalOpen(false)} 
      />

      <UploadDocumentModal 
        uploadModalState={uploadModalState} 
        setUploadModalState={setUploadModalState} 
      />

      <TrashBinModal 
        isOpen={isTrashModalOpen} 
        onClose={() => setIsTrashModalOpen(false)} 
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </DdaplLayout>
  )
}
