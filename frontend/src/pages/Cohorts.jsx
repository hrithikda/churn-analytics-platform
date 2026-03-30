import { useEffect, useState } from "react"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"
import { fetchCohorts } from "../api"

const fmtMoney = n => `$${(n / 1e6).toFixed(2)}M`
const colors = ["#2f9e44", "#f59f00", "#f76707", "#f03e3e"]

export default function Cohorts() {
  const [data, setData] = useState([])

  useEffect(() => { fetchCohorts().then(d => setData(d.filter(r => r.tenure_bucket && r.tenure_bucket !== "null"))) }, [])
  
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Cohort Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">Retention behavior segmented by customer tenure</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data.map((d, i) => (
          <div key={i} className="metric-card p-5">
            <div className="text-xs font-mono text-slate-500 mb-1">{d.tenure_bucket}</div>
            <div className="text-2xl font-semibold" style={{ color: colors[i] }}>{d.churn_rate_pct}%</div>
            <div className="text-xs text-slate-500 mt-1">churn rate</div>
            <div className="mt-3 pt-3 border-t border-[#232840] text-xs text-slate-400">{d.total_customers.toLocaleString()} customers</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="text-sm font-medium text-slate-300 mb-5">Churn Rate by Tenure Cohort</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barSize={40}>
              <CartesianGrid vertical={false} stroke="#232840" />
              <XAxis dataKey="tenure_bucket" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`]} />
              <Bar dataKey="churn_rate_pct" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="text-sm font-medium text-slate-300 mb-5">Annual Revenue at Risk</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f03e3e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f03e3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#232840" />
              <XAxis dataKey="tenure_bucket" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 12 }} formatter={v => [fmtMoney(v)]} />
              <Area type="monotone" dataKey="total_revenue_at_risk" stroke="#f03e3e" fill="url(#riskGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#232840] text-sm font-medium text-slate-300">Cohort Detail</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#232840]">
              {["Tenure", "Customers", "Churned", "Churn Rate", "Avg Monthly $", "Revenue at Risk"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-[#1a1e2e] hover:bg-[#ffffff04] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-300">{d.tenure_bucket}</td>
                <td className="px-6 py-4 text-slate-300">{d.total_customers.toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-300">{d.churned_customers.toLocaleString()}</td>
                <td className="px-6 py-4 font-semibold" style={{ color: colors[i] }}>{d.churn_rate_pct}%</td>
                <td className="px-6 py-4 text-slate-300">${d.avg_monthly_charges}</td>
                <td className="px-6 py-4 font-mono text-xs text-[#f59f00]">{fmtMoney(d.total_revenue_at_risk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}