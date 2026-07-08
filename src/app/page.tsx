'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = (role: string, customerId?: string) => {
    setLoading(true)
    // Mock login by setting localStorage
    localStorage.setItem('userRole', role)
    if (customerId) {
      localStorage.setItem('customerId', customerId)
    } else {
      localStorage.removeItem('customerId')
    }

    // Redirect based on role
    if (role === 'VENDOR') {
      router.push('/vendor')
    } else if (role === 'CUSTOMER') {
      router.push('/customer')
    } else if (role === 'ADMIN') {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-500 to-purple-600">
          <h1 className="text-3xl font-bold text-white mb-2">Vendor-Cust Portal</h1>
          <p className="text-indigo-100">Document Workflow System</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Select your role to continue</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleLogin('VENDOR')}
                disabled={loading}
                className="w-full py-3 px-4 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors duration-200"
              >
                Log in as Vendor
              </button>
              
              <button 
                onClick={() => handleLogin('CUSTOMER', 'mock-customer-id-1')}
                disabled={loading}
                className="w-full py-3 px-4 flex items-center justify-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold transition-colors duration-200"
              >
                Log in as Customer
              </button>
              
              <button 
                onClick={() => handleLogin('ADMIN')}
                disabled={loading}
                className="w-full py-3 px-4 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 font-semibold transition-colors duration-200"
              >
                Log in as Admin
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-slate-500 text-center max-w-md">
        This is an MVP mock login. In the final version, this will be replaced with real authentication.
      </p>
    </div>
  )
}
