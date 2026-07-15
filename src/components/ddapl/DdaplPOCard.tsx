import { Trash2, ExternalLink, Download, Plus, ChevronUp, ChevronDown, CheckCircle, UploadCloud, Eye, EyeOff } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PO, Shipment } from './DdaplDashboardClient' // We'll export these from the client

type DdaplPOCardProps = {
  po: PO
  isExpanded: boolean
  onToggle: () => void
  onDeletePO: (id: string) => void
  onAddShipment: (id: string) => void
  onDeleteDocument: (shipmentId: string, type: 'invoicePdf' | 'podPdf') => void
  onDeleteShipment: (id: string) => void
  onToggleVisibility: (shipment: Shipment) => void
  onUploadDocument: (shipmentId: string, type: 'invoicePdf' | 'podPdf') => void
}

export function DdaplPOCard({
  po,
  isExpanded,
  onToggle,
  onDeletePO,
  onAddShipment,
  onDeleteDocument,
  onDeleteShipment,
  onToggleVisibility,
  onUploadDocument
}: DdaplPOCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{po.poNumber}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Status: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{po.overallStatus.replace(/_/g, ' ')}</span></p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => onDeletePO(po.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors" title="Delete PO">
            <Trash2 className="w-4 h-4" />
          </button>
          <a href={`/api/files?path=${encodeURIComponent(po.poFile)}&view=true`} target="_blank" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors flex items-center">
            <ExternalLink className="w-4 h-4 mr-1.5" /> View PO
          </a>
          <a
            href={`/api/pos/${po.id}/download`}
            download
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Download PO
          </a>
          <button onClick={() => onAddShipment(po.id)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-1.5" /> Add Shipment
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button onClick={onToggle} className="text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors flex items-center">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {po.shipments.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No shipments added yet. Add one to start the workflow.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Shipment No.</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">POD</th>
                    <th className="px-6 py-3">Visibility</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                  {po.shipments.map(shipment => (
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
                      <td className="px-6 py-3">
                        {shipment.invoicePdf ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/60 rounded-md transition-colors shadow-sm w-fit">
                            <a href={`/api/files?path=${encodeURIComponent(shipment.invoicePdf)}&view=true`} target="_blank" className="text-emerald-700 dark:text-emerald-300 flex items-center font-medium text-sm" title="View Document">
                              <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{shipment.invoicePdf.split(/[/\\]/).pop()}</span>
                            </a>
                            <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800/60 mx-1"></div>
                            <button onClick={() => onDeleteDocument(shipment.id, 'invoicePdf')} className="text-emerald-400 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete Document">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => onUploadDocument(shipment.id, 'invoicePdf')} className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm"><UploadCloud className="w-4 h-4 mr-1.5" /> Upload</button>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {shipment.podPdf ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/60 rounded-md transition-colors shadow-sm w-fit">
                            <a href={`/api/files?path=${encodeURIComponent(shipment.podPdf)}&view=true`} target="_blank" className="text-emerald-700 dark:text-emerald-300 flex items-center font-medium text-sm" title="View Document">
                              <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{shipment.podPdf.split(/[/\\]/).pop()}</span>
                            </a>
                            <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800/60 mx-1"></div>
                            <button onClick={() => onDeleteDocument(shipment.id, 'podPdf')} className="text-emerald-400 dark:text-emerald-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete Document">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => onUploadDocument(shipment.id, 'podPdf')} className="inline-flex w-fit items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/60 rounded-md text-sm text-indigo-700 dark:text-indigo-300 font-medium transition-colors shadow-sm"><UploadCloud className="w-4 h-4 mr-1.5" /> Upload</button>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => onToggleVisibility(shipment)}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm border ${shipment.visibleToCustomer ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/50' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                          title={shipment.visibleToCustomer ? "Click to hide from Customer" : "Click to show to Customer"}
                        >
                          {shipment.visibleToCustomer ? (
                            <><Eye className="w-3.5 h-3.5 mr-1.5" /> Visible</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5 mr-1.5" /> Hidden</>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(shipment.invoicePdf || shipment.podPdf) && (
                            <a
                              href={`/api/shipments/${shipment.id}/download`}
                              download
                              className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 transition-colors shadow-sm"
                              title="Download Documents"
                            >
                              <Download className="w-4 h-4 mr-1.5" /> Download
                            </a>
                          )}
                          <button
                            onClick={() => onDeleteShipment(shipment.id)}
                            className="inline-flex items-center text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 shadow-sm"
                            title="Delete Shipment"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                          </button>
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
