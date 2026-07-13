'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

import { Eye, EyeOff } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { data: session, status } = useSession()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        toast.error(res.error)
        setLoading(false)
        return
      }

      // NextAuth automatically creates a session cookie.
      // The middleware or layouts will handle role-based redirection,
      // but for immediate feedback, we fetch the session to know where to redirect.
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      // Break loop: Only redirect if role is explicitly known
      const role = sessionData?.user?.role || (sessionData?.user as any)?.role;
      if (role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (role === 'DDAPL') {
        window.location.href = '/ddapl'
      } else if (role === 'CUSTOMER') {
        window.location.href = '/customer'
      } else {
        // If role is missing, don't redirect so we can see the error!
        toast.error('Login succeeded but role is missing from session.')
        setLoading(false)
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-500 to-purple-600">
          <h1 className="text-3xl font-bold text-white mb-2">Order Tracker</h1>
          <p className="text-indigo-100">Document Workflow System</p>
        </div>
        
        <div className="p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-xs text-slate-500 break-words">
              Session Debug: {JSON.stringify(session)}
            </div>
            
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full mt-2"
              size="lg"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
