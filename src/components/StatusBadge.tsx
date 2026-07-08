import React from 'react'

interface StatusBadgeProps {
  status: string
  remarks?: string | null
}

export function StatusBadge({ status, remarks }: StatusBadgeProps) {
  const badgeColors: Record<string, string> = {
    'WAITING_APPROVAL': 'bg-amber-100 text-amber-800',
    'ACCEPTED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
    'DRAFT': 'bg-slate-100 text-slate-600',
    'INVOICE_UPLOADED': 'bg-blue-100 text-blue-800',
  }

  const defaultColor = 'bg-slate-100 text-slate-800'
  const colorClass = badgeColors[status] || defaultColor

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize ${colorClass}`}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  )
}
