import { useState, useEffect } from 'react'
import { UploadCloud } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function UploadPOModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const queryClient = useQueryClient()

  // Fetch customers
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    }
  })

  const customers = users.filter((u: any) => u.role === 'CUSTOMER')

  useEffect(() => {
    if (customers.length === 1 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id)
    }
  }, [customers, selectedCustomerId])

  const createPOMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('customerId', selectedCustomerId)
      
      const res = await fetch('/api/pos', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to create PO')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos'] })
      onClose()
      setUploadFile(null)
      setSelectedCustomerId('')
    }
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Purchase Order">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Customer <span className="text-red-500">*</span></Label>
          {customers.length === 1 ? (
            <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 cursor-not-allowed">
              {customers[0].name} ({customers[0].email})
            </div>
          ) : (
            <Select 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="" disabled>Select a customer...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </Select>
          )}
        </div>
        
        <div>
          <Label className="mb-2 block">Upload PO Document (PDF or Image) <span className="text-red-500">*</span></Label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
            {uploadFile ? (
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{uploadFile.name}</span>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">Click or drag file to upload</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">The PO Number will be automatically extracted from the filename.</p>
        </div>
        <div className="flex justify-end pt-4">
          <Button 
            onClick={() => { if (uploadFile) createPOMutation.mutate(uploadFile) }} 
            disabled={!uploadFile || !selectedCustomerId || createPOMutation.isPending} 
          >
            <UploadCloud className="w-4 h-4 mr-2" /> 
            {createPOMutation.isPending ? 'Uploading...' : 'Upload PO'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
