import { Activity, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

export type AnalyticsData = {
  activePOs: number
  actionRequiredPOs: number
  rejectionRate: number
  avgCompletionDays: number
}

export function AnalyticsSidebar({ analytics }: { analytics: AnalyticsData }) {
  if (!analytics) return null;

  return (
    <div className="w-full lg:w-48 flex-shrink-0">
      <div className="sticky top-6">
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Overview</h2>
        <div className="flex flex-col gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3 flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.activePOs}</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Active POs</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-3 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.actionRequiredPOs}</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Action Required</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mr-3 flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.rejectionRate}%</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Rejection Rate</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 flex items-center transition-all hover:shadow-md">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-3 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-0.5">{analytics.avgCompletionDays} <span className="text-[10px] font-medium text-slate-500">days</span></h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">Avg Completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
