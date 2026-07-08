'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, LogOut, CheckCircle, Eye, EyeOff, UploadCloud, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { VendorLayout } from '@/components/VendorLayout'
import { StatusBadge } from '@/components/StatusBadge'

// Mock types based on schema
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

type PO = {
  id: string
  poNumber: string
  customerId: string
  poFile: string
  overallStatus: string
  shipments: Shipment[]
}

export default function VendorDashboard() {
  const router = useRouter()
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE')

  // Modal States
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
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
  const [trashItems, setTrashItems] = useState([])

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPOs = pos.filter(po => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (po.poNumber.toLowerCase().includes(q)) return true;
    if (po.overallStatus.toLowerCase().includes(q)) return true;
    
    return po.shipments.some(s => 
      s.shipmentNo.toString().includes(q) || 
      s.status.toLowerCase().includes(q) ||
      (s.invoicePdf && s.invoicePdf.toLowerCase().includes(q)) ||
      (s.podPdf && s.podPdf.toLowerCase().includes(q))
    );
  })

  const activePOs = filteredPOs.filter(po => po.overallStatus !== 'COMPLETED')
  const completedPOs = filteredPOs.filter(po => po.overallStatus === 'COMPLETED')
  
  const displayPOs = activeTab === 'ACTIVE' ? activePOs : completedPOs

  useEffect(() => {
    // Check auth
    const role = localStorage.getItem('userRole')
    if (role !== 'VENDOR' && role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchPOs()
  }, [router])

  const fetchPOs = async () => {
    try {
      const res = await fetch('/api/pos')
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

  const handleCreatePO = async () => {
    if (!uploadFile) return
    
    const formData = new FormData()
    formData.append('file', uploadFile)
    
    // In a real app, customerId would come from a dropdown
    formData.append('customerId', 'mock-customer-id-1')
    
    const res = await fetch('/api/pos', {
      method: 'POST',
      body: formData
    })
    
    if (res.ok) {
      fetchPOs()
      setIsCreatePOModalOpen(false)
      setUploadFile(null)
    }
  }

  const handleAddShipment = async (poId: string) => {
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poId })
    })
    
    if (res.ok) fetchPOs()
  }

  const handleToggleVisibility = async (shipment: Shipment) => {
    const res = await fetch(`/api/shipments/${shipment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibleToCustomer: !shipment.visibleToCustomer })
    })
    if (res.ok) fetchPOs()
  }

  const handleFileUpload = async () => {
    const { shipmentId, type, files } = uploadModalState
    if (!files.length || !type || !shipmentId) return
    
    const formData = new FormData()
    formData.append('type', type)
    files.forEach(file => formData.append('files', file))

    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PATCH',
      body: formData
    })
    
    if (res.ok) {
      fetchPOs()
      setUploadModalState({ isOpen: false, shipmentId: '', type: null, files: [] })
    }
  }

  const handleDeleteDocument = async (shipmentId: string, type: 'invoicePdf' | 'podPdf') => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    
    const res = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [type]: null })
    })
    
    if (res.ok) fetchPOs()
  }

  const handleDeletePO = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this entire PO? This will permanently delete all associated shipments as well.')) return;
    const res = await fetch(`/api/pos/${poId}`, { method: 'DELETE' })
    if (res.ok) fetchPOs()
  }

  const handleDeleteShipment = async (shipmentId: string) => {
    if (!confirm('Are you sure you want to move this shipment to the trash?')) return;
    const res = await fetch(`/api/shipments/${shipmentId}`, { method: 'DELETE' })
    if (res.ok) fetchPOs()
  }

  const fetchTrashItems = async () => {
    const res = await fetch('/api/trash')
    if (res.ok) {
      setTrashItems(await res.json())
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete these files? This action cannot be undone.')) return
    const res = await fetch(`/api/trash/${id}`, { method: 'DELETE' })
    if (res.ok) fetchTrashItems()
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  return (
    <VendorLayout 
      onSearch={setSearchQuery} 
      onOpenTrash={() => { setIsTrashModalOpen(true); fetchTrashItems(); }}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-indigo-500" /> Purchase Orders
                </h2>
                
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Active ({activePOs.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Completed ({completedPOs.length})
                  </button>
                </div>
              </div>
              <button onClick={() => setIsCreatePOModalOpen(true)} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all w-full sm:w-auto justify-center">
                <Plus className="w-4 h-4 mr-2" /> New PO
              </button>
            </div>

            <div className="space-y-8">
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
                  <button onClick={() => handleAddShipment(po.id)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {po.shipments.map(shipment => (
                      <div key={shipment.id} className="border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-5 relative group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors bg-white dark:bg-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-5">
                          <h4 className="font-bold text-slate-700 dark:text-slate-200">Shipment {shipment.shipmentNo}</h4>
                          <button 
                            onClick={() => handleToggleVisibility(shipment)}
                            className={`p-1.5 rounded-full transition-colors ${shipment.visibleToCustomer ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title={shipment.visibleToCustomer ? "Visible to Customer" : "Hidden from Customer"}
                          >
                            {shipment.visibleToCustomer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Invoice</span>
                            {shipment.invoicePdf ? (
                              <div className="flex items-center gap-4">
                                <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center transition-colors" title="View Document">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                  <span className="truncate max-w-[120px]">{shipment.invoicePdf.split(/[/\\]/).pop()}</span>
                                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                </a>
                                <button onClick={() => handleDeleteDocument(shipment.id, 'invoicePdf')} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete Document">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setUploadModalState({ isOpen: true, shipmentId: shipment.id, type: 'invoicePdf', files: [] })} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"><UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload</button>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">POD</span>
                            {shipment.podPdf ? (
                              <div className="flex items-center gap-4">
                                <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center transition-colors" title="View Document">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                  <span className="truncate max-w-[120px]">{shipment.podPdf.split(/[/\\]/).pop()}</span>
                                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                </a>
                                <button onClick={() => handleDeleteDocument(shipment.id, 'podPdf')} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete Document">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setUploadModalState({ isOpen: true, shipmentId: shipment.id, type: 'podPdf', files: [] })} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"><UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload</button>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                          <div>
                            <StatusBadge status={shipment.status} />
                            
                            {shipment.status === 'REJECTED' && shipment.customerRemarks && (
                              <p className="mt-2 text-xs text-red-600 font-medium">Reason: {shipment.customerRemarks}</p>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteShipment(shipment.id)}
                            className="flex items-center text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Shipment"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          ))}
            </div>
            {displayPOs.length === 0 && !loading && (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 border-dashed">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  {searchQuery ? `No ${activeTab === 'ACTIVE' ? 'Active' : 'Completed'} Purchase Orders match your search` : `No ${activeTab === 'ACTIVE' ? 'Active' : 'Completed'} Purchase Orders yet`}
                </h3>
                <p className="text-slate-500 mt-1">
                  {searchQuery ? 'Try adjusting your search terms.' : activeTab === 'ACTIVE' ? 'Get started by creating a new PO.' : 'Completed POs will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      <Modal isOpen={isCreatePOModalOpen} onClose={() => { setIsCreatePOModalOpen(false); setUploadFile(null); }} title="Upload New Purchase Order">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select PO File (PDF, DOCX, etc.)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
              {uploadFile ? (
                <span className="text-sm font-medium text-indigo-600">{uploadFile.name}</span>
              ) : (
                <span className="text-sm text-slate-500">Click or drag file to upload</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">The PO Number will be automatically extracted from the filename.</p>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={handleCreatePO} disabled={!uploadFile} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload PO
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload File Modal */}
      <Modal isOpen={uploadModalState.isOpen} onClose={() => setUploadModalState(prev => ({...prev, isOpen: false, files: []}))} title={`Upload ${uploadModalState.type === 'invoicePdf' ? 'Invoice' : 'POD'}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select PDFs or Images (Multiple allowed)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files)
                    setUploadModalState(prev => ({...prev, files: [...prev.files, ...newFiles]}))
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Plus className="w-8 h-8 text-indigo-400 mb-2" />
              <span className="text-sm text-slate-500">Click to add file(s)</span>
            </div>
            
            {uploadModalState.files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-slate-700">Selected files to merge:</p>
                {uploadModalState.files.map((file, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-100 p-2 rounded text-sm text-slate-700">
                    <span className="truncate pr-4">{file.name}</span>
                    <button 
                      onClick={() => setUploadModalState(prev => ({
                        ...prev, 
                        files: prev.files.filter((_, index) => index !== i)
                      }))}
                      className="text-slate-400 hover:text-red-500 font-bold p-1 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {uploadModalState.files.length > 1 && (
              <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" /> These files will be converted and merged into a single PDF.
              </p>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleFileUpload} 
              disabled={uploadModalState.files.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <UploadCloud className="w-4 h-4 mr-2" /> Merge & Upload
            </button>
          </div>
        </div>
      </Modal>

      {/* Trash Bin Modal */}
      <Modal isOpen={isTrashModalOpen} onClose={() => setIsTrashModalOpen(false)} title="Trash Bin">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4">Files here will be permanently removed from OneDrive when deleted.</p>
          {trashItems.length === 0 ? (
            <p className="text-slate-500 text-center py-8">The trash bin is empty.</p>
          ) : (
            trashItems.map((item: any) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center bg-slate-50">
                <div>
                  <h4 className="font-medium text-slate-800">{item.entityName}</h4>
                  <p className="text-xs text-slate-500">Deleted: {new Date(item.deletedAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-400 mt-1">{JSON.parse(item.filePaths).length} file(s)</p>
                </div>
                <button 
                  onClick={() => handlePermanentDelete(item.id)}
                  className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Forever
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

    </VendorLayout>
  )
}
