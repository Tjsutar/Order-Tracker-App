'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, CheckCircle, XCircle, Download, File, RefreshCw, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { StatusBadge } from '@/components/StatusBadge'
import { CustomerLayout } from '@/components/CustomerLayout'

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

export default function CustomerDashboard() {
  const router = useRouter()
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [rejectModalState, setRejectModalState] = useState<{isOpen: boolean, shipmentId: string, reason: string}>({
    isOpen: false,
    shipmentId: '',
    reason: ''
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE')

  const filteredPOs = pos.filter(po => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (po.poNumber.toLowerCase().includes(q)) return true;
    if (po.overallStatus.toLowerCase().includes(q)) return true;
    
    return po.shipments.some(s => 
      s.shipmentNo.toString().includes(q) || 
      s.status.toLowerCase().includes(q)
    );
  })

  const activePOs = filteredPOs.filter(po => po.overallStatus !== 'COMPLETED')
  const completedPOs = filteredPOs.filter(po => po.overallStatus === 'COMPLETED')
  
  const displayPOs = activeTab === 'ACTIVE' ? activePOs : completedPOs

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'CUSTOMER' && role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchPOs()
  }, [router])

  const fetchPOs = async () => {
    const customerId = localStorage.getItem('customerId') || 'mock-customer-id-1'
    try {
      const res = await fetch(`/api/pos?role=CUSTOMER&customerId=${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setPos(data)
      }
    } catch (error) {
      console.error('Failed to fetch POs', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (shipmentId: string, action: 'ACCEPTED') => {
    // Rejection is handled by handleRejectSubmit via the Modal
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action })
    })
    
    if (res.ok) fetchPOs()
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
      fetchPOs()
      setRejectModalState({ isOpen: false, shipmentId: '', reason: '' })
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) return (
    <CustomerLayout>
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-teal-500 w-8 h-8" />
      </div>
    </CustomerLayout>
  )

  return (
    <CustomerLayout onSearch={setSearchQuery}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-3 text-teal-500" /> My Purchase Orders
          </h2>
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Active ({activePOs.length})
            </button>
            <button 
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Completed ({completedPOs.length})
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {displayPOs.map(po => {
            const visibleShipments = po.shipments.filter(s => s.visibleToCustomer && s.status !== 'DRAFT')
            
            return (
              <div key={po.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{po.poNumber}</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold text-teal-600 dark:text-teal-400">{po.overallStatus.replace(/_/g, ' ')}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
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
                  </div>
                </div>
                
                <div className="p-6">
                  {visibleShipments.length === 0 ? (
                    <p className="text-slate-400 text-sm italic py-4">No shipments visible for this PO yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {visibleShipments.map(shipment => (
                        <div key={shipment.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-800 relative overflow-hidden">
                          {/* Left side: Info */}
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-lg text-slate-800 dark:text-white">Shipment {shipment.shipmentNo}</h4>
                              <StatusBadge status={shipment.status} />
                            </div>
                            
                            <div className="flex gap-4">
                              {shipment.invoicePdf && (
                                <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors">
                                  <File className="w-4 h-4 mr-1.5" /> Invoice <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              )}
                              {shipment.podPdf && (
                                <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors">
                                  <File className="w-4 h-4 mr-1.5" /> POD <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              )}
                            </div>
                            
                            {shipment.status === 'REJECTED' && shipment.customerRemarks && (
                              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md text-sm border border-red-100 dark:border-red-800/30">
                                <strong>Reason for rejection:</strong> {shipment.customerRemarks}
                              </div>
                            )}
                          </div>
                          
                          {/* Right side: Actions */}
                          <div className="flex flex-col sm:flex-row gap-3 min-w-max border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-700">
                            {shipment.status === 'WAITING_APPROVAL' && (
                              <>
                                <button 
                                  onClick={() => handleAction(shipment.id, 'ACCEPTED')}
                                  className="flex-1 lg:flex-none justify-center flex items-center bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                </button>
                                <button 
                                  onClick={() => setRejectModalState({ isOpen: true, shipmentId: shipment.id, reason: '' })}
                                  className="flex-1 lg:flex-none justify-center flex items-center bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-5 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                  <XCircle className="w-4 h-4 mr-2" /> Reject
                                </button>
                              </>
                            )}
                            <a 
                              href={`/api/shipments/${shipment.id}/download`}
                              download
                              className="flex-1 lg:flex-none justify-center flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg font-medium transition-colors"
                            >
                              <Download className="w-4 h-4 mr-2" /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {displayPOs.length === 0 && !loading && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 border-dashed">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                {searchQuery ? `No ${activeTab === 'ACTIVE' ? 'Active' : 'Completed'} Purchase Orders match your search` : `No ${activeTab === 'ACTIVE' ? 'Active' : 'Completed'} Purchase Orders yet`}
              </h3>
              <p className="text-slate-500 mt-1">
                {searchQuery ? 'Try adjusting your search terms.' : activeTab === 'ACTIVE' ? 'Waiting for vendors to create new POs.' : 'Completed POs will appear here.'}
              </p>
            </div>
          )}
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
