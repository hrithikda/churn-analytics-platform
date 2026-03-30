import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"
import { fetchFeatureImportance, fetchModelMetrics } from "../api"

function MetricBox({ label, value, sub }) {
  return (
    <div className="metric-card p-5">
      <div className="text-xs tracking-widest uppercase text-slate-500 mb-2">{label}</div>
      <div className="text-2xl font-semibold text-[#6c8ef7]">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function ModelInsights() {
  const [importance, setImportance] = useState([])
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetchFeatureImportance().then(d => setImportance(d.features || []))
    fetchModelMetrics().then(setMetrics)
  }, [])

  const top = importance.slice(0, 12)
  const maxShap = top[0]?.mean_abs_shap || 1

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Model Insights</h1>
        <p className="text-sm text-slate-500 mt-1">XGBoost churn model performance and SHAP feature attribution</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricBox label="ROC-AUC" value={metrics?.roc_auc ?? "..."} sub="Area under ROC curve" />
        <MetricBox label="CV AUC" value={metrics ? `${metrics.cv_auc_mean} ±${metrics.cv_auc_std}` : "..."} sub="5-fold cross validation" />
        <MetricBox label="Avg Precision" value={metrics?.average_precision ?? "..."} sub="Precision-recall AUC" />
        <MetricBox label="Test Set" value={metrics?.test_size ?? "..."} sub={`of ${(metrics?.train_size ?? 0) + (metrics?.test_size ?? 0)} total`} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="text-sm font-medium text-slate-300 mb-5">SHAP Feature Importance</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top} layout="vertical" barSize={14}>
              <CartesianGrid horizontal={false} stroke="#232840" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(3)} />
              <YAxis type="category" dataKey="feature" width={180} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 11 }} formatter={v => [v.toFixed(4), "Mean |SHAP|"]} />
              <Bar dataKey="mean_abs_shap" radius={[0, 4, 4, 0]}>
                {top.map((_, i) => (
                  <Cell key={i} fill={`hsl(${230 + (i / top.length) * 60}, 70%, ${65 - (i / top.length) * 25}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 space-y-4">
          <div className="text-sm font-medium text-slate-300">Top Churn Drivers</div>
          <p className="text-xs text-slate-500">SHAP values show each feature's average contribution to the model's churn prediction. Higher values mean stronger influence.</p>
          <div className="space-y-3">
            {top.slice(0, 8).map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 truncate max-w-[200px]">{d.feature}</span>
                  <span className="font-mono text-slate-500">{d.mean_abs_shap.toFixed(4)}</span>
                </div>
                <div className="w-full bg-[#232840] rounded-full h-1">
                  <div className="h-1 rounded-full" style={{
                    width: `${(d.mean_abs_shap / maxShap) * 100}%`,
                    background: `hsl(${230 + (i / 8) * 60}, 70%, ${65 - (i / 8) * 25}%)`
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-[#232840] text-xs text-slate-500">
            Model trained on Telco Churn dataset (7,043 customers). XGBoost with 300 estimators, 5-fold CV, SHAP TreeExplainer for attribution.
          </div>
        </div>
      </div>
    </div>
  )
}