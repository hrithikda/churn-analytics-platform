import { useEffect, useState } from "react"
import { fetchHighRisk } from "../api"
import { Search, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react"

const RiskBadge = ({ prob, actual }) => {
  if (actual) return <span className="badge-high">Churned</span>
  return <span className="badge-low">Retained</span>
}

export default function RiskTable() {
  const [data, setData] = useState([])
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState({ col: "monthly_charges", dir: "desc" })

  useEffect(() => { fetchHighRisk(100).then(setData) }, [])

  const toggle = col => setSort(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }))

  const filtered = data
    .filter(d => {
      const q = query.toLowerCase()
      const matchQuery = !q || d.customer_id.toLowerCase().includes(q) || d.contract.toLowerCase().includes(q)
      const matchFilter = filter === "all" || (filter === "churned" && d.actual_churn) || (filter === "retained" && !d.actual_churn)
      return matchQuery && matchFilter
    })
    .sort((a, b) => {
      const va = a[sort.col] ?? 0
      const vb = b[sort.col] ?? 0
      return sort.dir === "desc" ? vb - va : va - vb
    })

  const SortIcon = ({ col }) => sort.col === col
    ? (sort.dir === "desc" ? <ChevronDown size={12} className="text-[#6c8ef7]" /> : <ChevronUp size={12} className="text-[#6c8ef7]" />)
    : <ChevronDown size={12} className="text-slate-600" />

  const counts = {
    all: data.length,
    churned: data.filter(d => d.actual_churn).length,
    retained: data.filter(d => !d.actual_churn).length
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Customer Risk Table</h1>
        <p className="text-sm text-slate-500 mt-1">High-value customers ranked by monthly charges</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ID or contract..."
            className="w-full pl-8 pr-4 py-2 bg-[#181c27] border border-[#232840] rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#3b5bdb]"
          />
        </div>
        <div className="flex gap-1">
          {[["all", "All"], ["churned", "Churned"], ["retained", "Retained"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-2 rounded-lg text-xs transition-all ${filter === k ? "bg-[#3b5bdb] text-white" : "bg-[#181c27] border border-[#232840] text-slate-400 hover:text-slate-200"}`}>
              {l} <span className="ml-1 opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#232840]">
              {[
                { key: "customer_id", label: "Customer ID" },
                { key: "contract", label: "Contract" },
                { key: "tenure", label: "Tenure" },
                { key: "monthly_charges", label: "Monthly $" },
                { key: "internet_service", label: "Internet" },
                { key: "payment_method", label: "Payment" },
                { key: "actual_churn", label: "Status" },
              ].map(({ key, label }) => (
                <th key={key} onClick={() => toggle(key)}
                  className="px-5 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase cursor-pointer hover:text-slate-300 select-none">
                  <div className="flex items-center gap-1">{label} <SortIcon col={key} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={i} className="border-b border-[#1a1e2e] hover:bg-[#ffffff03] transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-[#6c8ef7]">{d.customer_id}</td>
                <td className="px-5 py-3 text-slate-300 text-xs">{d.contract}</td>
                <td className="px-5 py-3 text-slate-300">{d.tenure}mo</td>
                <td className="px-5 py-3 text-slate-300">${d.monthly_charges}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{d.internet_service}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{d.payment_method}</td>
                <td className="px-5 py-3"><RiskBadge actual={d.actual_churn} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#232840] text-xs text-slate-600">
          Showing {filtered.length} of {data.length} customers
        </div>
      </div>
    </div>
  )
}