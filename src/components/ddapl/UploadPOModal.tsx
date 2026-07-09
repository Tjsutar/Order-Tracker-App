import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function UploadPOModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  const createPOMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('customerId', 'mock-customer-id-1') // Mock
      
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
    }
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Purchase Order">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Upload PO Document (PDF or Image)</label>
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
          <button 
            onClick={() => { if (uploadFile) createPOMutation.mutate(uploadFile) }} 
            disabled={!uploadFile || createPOMutation.isPending} 
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> 
            {createPOMutation.isPending ? 'Uploading...' : 'Upload PO'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
