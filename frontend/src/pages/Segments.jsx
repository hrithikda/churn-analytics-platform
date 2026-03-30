import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts"
import { fetchSegment } from "../api"

const PALETTE = ["#3b5bdb", "#f03e3e", "#f59f00", "#2f9e44", "#7950f2", "#20c997"]
const OPTIONS = [
  { key: "contract", label: "Contract" },
  { key: "internetservice", label: "Internet Service" },
  { key: "paymentmethod", label: "Payment Method" },
  { key: "gender", label: "Gender" },
]

export default function Segments() {
  const [active, setActive] = useState("contract")
  const [data, setData] = useState([])

  useEffect(() => { fetchSegment(active).then(setData) }, [active])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Segment Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">Churn behavior broken down by customer attributes</p>
      </div>

      <div className="flex gap-2">
        {OPTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => setActive(key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${active === key ? "bg-[#3b5bdb] text-white" : "bg-[#181c27] border border-[#232840] text-slate-400 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="text-sm font-medium text-slate-300 mb-5">Churn Rate (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" barSize={20}>
              <CartesianGrid horizontal={false} stroke="#232840" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="segment_value" width={140} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`, "Churn Rate"]} />
              <Bar dataKey="churn_rate_pct" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="text-sm font-medium text-slate-300 mb-5">Customer Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="segment_value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} stroke="none">
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#181c27", border: "1px solid #232840", borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden col-span-2">
          <div className="px-6 py-4 border-b border-[#232840] text-sm font-medium text-slate-300">Segment Detail</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#232840]">
                {["Segment", "Total", "Churned", "Churn Rate", "Avg Monthly $"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-b border-[#1a1e2e] hover:bg-[#ffffff04] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-slate-200">{d.segment_value}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{d.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-300">{d.churned.toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: d.churn_rate_pct > 40 ? "#f03e3e" : d.churn_rate_pct > 20 ? "#f59f00" : "#2f9e44" }}>{d.churn_rate_pct}%</td>
                  <td className="px-6 py-4 text-slate-300">${d.avg_monthly_charges}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}