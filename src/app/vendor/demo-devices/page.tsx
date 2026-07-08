'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Smartphone, Plus, UploadCloud, RefreshCw, Send, CheckCircle, ExternalLink, Trash2 } from 'lucide-react'
import { VendorLayout } from '@/components/VendorLayout'
import { Modal } from '@/components/Modal'

type DemoDevice = {
  id: string
  customerEmail: string
  dcPdf: string
  podPdf: string
  status: string
  linkToken: string
  createdAt: string
}

export default function DemoDevicesDashboard() {
  const router = useRouter()
  const [demos, setDemos] = useState<DemoDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const [dcFile, setDcFile] = useState<File | null>(null)
  const [podFile, setPodFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'VENDOR' && role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchDemos()
  }, [router])

  const fetchDemos = async () => {
    try {
      const res = await fetch('/api/demo-devices')
      if (res.ok) {
        setDemos(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch demo devices', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!customerEmail || !dcFile || !podFile) return
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('customerEmail', customerEmail)
    formData.append('dcFile', dcFile)
    formData.append('podFile', podFile)
    
    try {
      const res = await fetch('/api/demo-devices', {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        fetchDemos()
        setIsModalOpen(false)
        setCustomerEmail('')
        setDcFile(null)
        setPodFile(null)
      } else {
        alert('Failed to create demo device')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this demo tracking link? The customer will no longer be able to view it.')) return
    
    try {
      const res = await fetch(`/api/demo-devices?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchDemos()
    } catch (error) {
      console.error(error)
    }
  }

  const filteredDemos = demos.filter(d => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.customerEmail.toLowerCase().includes(q) || d.status.toLowerCase().includes(q)
  })

  return (
    <VendorLayout onSearch={setSearchQuery}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto py-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Smartphone className="w-6 h-6 mr-3 text-indigo-500" /> Demo Devices
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Send New Demo
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filteredDemos.length === 0 ? (
            <div className="text-center py-20">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No demo devices found</h3>
              <p className="text-slate-500 mt-1">Send a new demo to automatically email the customer a tracking link.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Public Link</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDemos.map((demo) => (
                  <tr key={demo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(demo.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {demo.customerEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${demo.status === 'SENT' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {demo.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={`/demo/${demo.linkToken}`} target="_blank" className="text-indigo-600 hover:text-indigo-900 flex items-center">
                        <ExternalLink className="w-4 h-4 mr-1" /> View Public Page
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(demo.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setDcFile(null); setPodFile(null); setCustomerEmail(''); }} title="Send Demo Device">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer Email</label>
            <input 
              type="email" 
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Challan (DC)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 relative cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setDcFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {dcFile ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
                    <span className="text-xs font-medium text-slate-600 truncate max-w-full px-2">{dcFile.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                    <span className="text-xs text-slate-500">Upload DC PDF</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Proof of Delivery (POD)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 relative cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setPodFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {podFile ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
                    <span className="text-xs font-medium text-slate-600 truncate max-w-full px-2">{podFile.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                    <span className="text-xs text-slate-500">Upload POD PDF</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
            <button 
              onClick={handleSubmit} 
              disabled={!customerEmail || !dcFile || !podFile || isSubmitting} 
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-md shadow-indigo-200"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Link to Customer</>
              )}
            </button>
          </div>
        </div>
      </Modal>

    </VendorLayout>
  )
}
