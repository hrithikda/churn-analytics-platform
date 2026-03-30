import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { fetchKPIs, fetchSegment } from "../api"

function KPICard({ label, value, accent }) {
  return (
    <div className="metric-card p-5">
      <div className="text-xs font-medium tracking-widest uppercase text-slate-500 mb-3">{label}</div>
      <div className="text-2xl font-semibold" style={{ color: accent || "#e8eaf0" }}>{value}</div>
    </div>
  )
}

export default function Overview() {
  const [kpis, setKpis] = useState(null)
  const [seg, setSeg] = useState([])

  useEffect(() => {
    fetchKPIs().then(setKpis)
    fetchSegment("contract").then(setSeg)
  }, [])

  const colors = ["#f03e3e", "#f59f00", "#2f9e44"]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Executive Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Customer retention health across all segments</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total Customers" value={kpis?.total_customers?.toLocaleString() ?? "..."} accent="#6c8ef7" />
        <KPICard label="Churn Rate" value={kpis ? `${kpis.churn_rate_pct}%` : "..."} accent="#f03e3e" />
        <KPICard label="Avg Monthly Charges" value={kpis ? `$${kpis.avg_monthly_charges}` : "..."} accent="#20c997" />
        <KPICard label="Annual Revenue at Risk" value={kpis ? `$${(kpis.annual_revenue_at_risk / 1e6).toFixed(2)}M` : "..."} accent="#f59f00" />
      </div>

      <div className="card p-6">
        <div className="text-sm font-medium text-slate-300 mb-5">Churn Rate by Contract Type</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={seg} barSize={48}>
            <XAxis dataKey="segment_value" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 12 }}
              formatter={v => [`${v}%`, "Churn Rate"]}
            />
            <Bar dataKey="churn_rate_pct" radius={[4, 4, 0, 0]}>
              {seg.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}