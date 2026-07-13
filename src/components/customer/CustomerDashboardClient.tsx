'use client'

import { useState, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, CheckCircle, XCircle, Download, File, RefreshCw, ExternalLink, ChevronUp, ChevronDown, TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { StatusBadge } from '@/components/StatusBadge'
import { CustomerLayout } from '@/components/CustomerLayout'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { CustomerAnalyticsSidebar } from './CustomerAnalyticsSidebar'
import { CustomerPOCard } from './CustomerPOCard'

export type Shipment = {
  id: string
  poId: string
  shipmentNo: number
  invoicePdf: string | null
  podPdf: string | null
  status: string
  customerRemarks: string | null
  visibleToCustomer: boolean
}

export type PO = {
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
          <CustomerAnalyticsSidebar analytics={analytics} />
        )}

        <div className="flex-1 min-w-0">
          <div className="space-y-4">
        {displayPOs.map(po => (
            <CustomerPOCard
              key={po.id}
              po={po}
              isExpanded={!!expandedPOs[po.id]}
              onToggle={() => togglePO(po.id)}
              onAction={handleAction}
              onReject={(shipmentId) => setRejectModalState({ isOpen: true, shipmentId, reason: '' })}
            />
          ))}
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
