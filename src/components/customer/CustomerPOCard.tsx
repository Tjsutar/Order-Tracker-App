import { ExternalLink, Download, ChevronUp, ChevronDown, CheckCircle, XCircle, File } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PO, Shipment } from './CustomerDashboardClient'

type CustomerPOCardProps = {
  po: PO
  isExpanded: boolean
  onToggle: () => void
  onAction: (shipmentId: string, action: 'ACCEPTED') => void
  onReject: (shipmentId: string) => void
}

export function CustomerPOCard({
  po,
  isExpanded,
  onToggle,
  onAction,
  onReject
}: CustomerPOCardProps) {
  const visibleShipments = po.shipments.filter(s => s.visibleToCustomer)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{po.poNumber}</h3>
          <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold text-teal-600 dark:text-teal-400">{po.overallStatus.replace(/_/g, ' ')}</span></p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={`/api/files?path=${encodeURIComponent(po.poFile)}&view=true`}
            target="_blank"
            className="text-sm font-medium text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-white bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" /> View PO
          </a>
          <a
            href={`/api/pos/${po.id}/download`}
            download
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Download Entire PO
          </a>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button onClick={onToggle} className="text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors flex items-center">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {visibleShipments.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">No shipments visible for this PO yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Shipment No.</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Documents</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                  {visibleShipments.map(shipment => (
                    <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-800 dark:text-white">
                        Shipment {shipment.shipmentNo}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={shipment.status} />
                        {shipment.status === 'REJECTED' && shipment.customerRemarks && (
                          <p className="mt-2 text-xs text-red-600 font-medium truncate max-w-[200px]" title={shipment.customerRemarks}>Reason: {shipment.customerRemarks}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          {shipment.invoicePdf && (
                            <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-all shadow-sm w-[105px] justify-center">
                              <File className="w-4 h-4 mr-1.5" /> Invoice
                            </a>
                          )}
                          {shipment.podPdf && (
                            <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-all shadow-sm w-[105px] justify-center">
                              <File className="w-4 h-4 mr-1.5" /> POD
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {shipment.status === 'WAITING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => onAction(shipment.id, 'ACCEPTED')}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-all shadow-sm w-[105px] justify-center cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Accept
                              </button>
                              <button
                                onClick={() => onReject(shipment.id)}
                                className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-md text-sm font-medium transition-all shadow-sm w-[105px] justify-center cursor-pointer"
                              >
                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                              </button>
                            </>
                          )}
                          <a
                            href={`/api/shipments/${shipment.id}/download`}
                            download
                            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-sm font-medium transition-all shadow-sm w-[115px] justify-center"
                          >
                            <Download className="w-4 h-4 mr-1.5" /> Download
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
