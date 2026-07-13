import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export function TrashBinModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient()
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    id: string
  }>({
    isOpen: false,
    id: ''
  })

  const { data: trashItems = [] } = useQuery({
    queryKey: ['trash'],
    queryFn: async () => {
      const res = await fetch('/api/trash')
      if (!res.ok) throw new Error('Failed to fetch trash items')
      return res.json()
    },
    enabled: isOpen
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trash/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to permanently delete item')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] })
      toast.success('Files permanently deleted')
    }
  })

  const confirmDelete = (id: string) => {
    setConfirmConfig({ isOpen: true, id })
  }

  const executeDelete = () => {
    deleteMutation.mutate(confirmConfig.id)
    setConfirmConfig({ isOpen: false, id: '' })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Trash Bin">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Files here will be permanently removed from OneDrive when deleted.</p>
        {trashItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8">The trash bin is empty.</p>
        ) : (
          trashItems.map((item: any) => (
            <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200">{item.entityName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deleted: {new Date(item.deletedAt).toLocaleDateString()}</p>
                <p className="text-xs text-slate-400 mt-1">{JSON.parse(item.filePaths).length} file(s)</p>
              </div>
              <button 
                onClick={() => confirmDelete(item.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 hover:text-red-800 dark:hover:text-red-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> {deleteMutation.isPending ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          ))
        )}
      </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={executeDelete}
        title="Empty Trash"
        message="Are you sure you want to permanently delete these files? This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  )
}
