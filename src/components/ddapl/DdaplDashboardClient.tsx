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

import { AnalyticsSidebar } from './AnalyticsSidebar'
import { DdaplPOCard } from './DdaplPOCard'

export type Shipment = {
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
          <AnalyticsSidebar analytics={analytics} />
        )}

        {/* Right Side: PO List */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
          {displayPOs.map(po => (
            <DdaplPOCard
              key={po.id}
              po={po}
              isExpanded={!!expandedPOs[po.id]}
              onToggle={() => togglePO(po.id)}
              onDeletePO={handleDeletePO}
              onAddShipment={(id) => addShipmentMutation.mutate(id)}
              onDeleteDocument={handleDeleteDocument}
              onDeleteShipment={handleDeleteShipment}
              onToggleVisibility={(shipment) => toggleVisibilityMutation.mutate(shipment)}
              onUploadDocument={(shipmentId, type) => setUploadModalState({ isOpen: true, shipmentId, type, files: [] })}
            />
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
