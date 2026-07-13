import { CheckCircle, UploadCloud, Plus } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type UploadModalState = {
  isOpen: boolean
  shipmentId: string
  type: 'invoicePdf' | 'podPdf' | null
  files: File[]
}

export function UploadDocumentModal({ 
  uploadModalState, 
  setUploadModalState 
}: { 
  uploadModalState: UploadModalState, 
  setUploadModalState: React.Dispatch<React.SetStateAction<UploadModalState>> 
}) {
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async ({ shipmentId, type, files }: { shipmentId: string, type: 'invoicePdf' | 'podPdf', files: File[] }) => {
      const formData = new FormData()
      formData.append('type', type)
      files.forEach(file => formData.append('files', file))

      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload files')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos'] })
      setUploadModalState({ isOpen: false, shipmentId: '', type: null, files: [] })
    }
  })

  return (
    <Modal isOpen={uploadModalState.isOpen} onClose={() => setUploadModalState(prev => ({...prev, isOpen: false, files: []}))} title={`Upload ${uploadModalState.type === 'invoicePdf' ? 'Invoice' : 'POD'}`}>
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Select PDFs or Images (Multiple allowed)</Label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer relative">
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
            <span className="text-sm text-slate-500 dark:text-slate-400">Click to add file(s)</span>
          </div>
          
          {uploadModalState.files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Selected files to merge:</p>
              {uploadModalState.files.map((file, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm text-slate-700 dark:text-slate-300">
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
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium flex items-center">
              <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" /> These files will be converted and merged into a single PDF.
            </p>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button 
            onClick={() => {
              if (uploadModalState.type && uploadModalState.shipmentId) {
                uploadMutation.mutate({ 
                  shipmentId: uploadModalState.shipmentId, 
                  type: uploadModalState.type, 
                  files: uploadModalState.files 
                })
              }
            }} 
            disabled={uploadModalState.files.length === 0 || uploadMutation.isPending}
          >
            <UploadCloud className="w-4 h-4 mr-2" /> 
            {uploadMutation.isPending ? 'Uploading...' : 'Merge & Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
