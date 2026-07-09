'use client'

import { useState, useEffect, use } from 'react'
import { FileText, CheckCircle, Smartphone, ExternalLink, RefreshCw, AlertCircle, XCircle } from 'lucide-react'

type DemoDevice = {
  id: string
  customerEmail: string
  dcPdf: string
  podPdf: string
  status: string
  createdAt: string
}

export default function PublicDemoPage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params)
  const [demo, setDemo] = useState<DemoDevice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDemo = async () => {
      try {
        const res = await fetch(`/api/public/demo/${params.token}`)
        if (res.ok) {
          setDemo(await res.json())
        } else {
          const err = await res.json()
          setError(err.error || 'Failed to load demo link')
        }
      } catch (err) {
        setError('A network error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchDemo()
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-500">{error || 'This secure link is invalid, expired, or has been revoked by DDAPL.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-200">
          <Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Your Demo Device Documents</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Securely review your Delivery Challan and Proof of Delivery.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-1">Prepared for</p>
            <p className="font-semibold text-lg">{demo.customerEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm font-medium mb-1">Date Sent</p>
            <p className="font-semibold">{new Date(demo.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center mb-6">
            <CheckCircle className="w-6 h-6 text-emerald-500 mr-2" />
            <h2 className="text-xl font-bold text-slate-800">Available Documents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DC Document */}
            <div className="border border-slate-200 rounded-xl p-6 hover:border-indigo-300 transition-colors bg-slate-50 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Delivery Challan</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">{demo.dcPdf.split(/[/\\]/).pop()}</p>
                  </div>
                </div>
              </div>
              <a 
                href={`/api/files?path=${encodeURIComponent(demo.dcPdf)}&view=true`} 
                target="_blank"
                className="w-full mt-2 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-sm group-hover:shadow"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> View DC Document
              </a>
            </div>

            {/* POD Document */}
            <div className="border border-slate-200 rounded-xl p-6 hover:border-indigo-300 transition-colors bg-slate-50 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Proof of Delivery</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">{demo.podPdf.split(/[/\\]/).pop()}</p>
                  </div>
                </div>
              </div>
              <a 
                href={`/api/files?path=${encodeURIComponent(demo.podPdf)}&view=true`} 
                target="_blank"
                className="w-full mt-2 bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 text-slate-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-sm group-hover:shadow"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> View POD Document
              </a>
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              This is a secure, unique link generated specifically for you. Do not share this link with unauthorized parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
