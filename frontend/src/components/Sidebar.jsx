import { BarChart2, TrendingDown, Users, Activity, Brain } from "lucide-react"

const nav = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "cohorts", label: "Cohort Analysis", icon: TrendingDown },
  { id: "segments", label: "Segments", icon: Users },
  { id: "risk", label: "Risk Table", icon: Activity },
  { id: "model", label: "Model Insights", icon: Brain },
]

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="w-52 shrink-0 flex flex-col h-screen sticky top-0 border-r border-[#232840] bg-[#0d1020]">
      <div className="px-5 py-6 border-b border-[#232840]">
        <div className="text-xs font-mono text-[#3b5bdb] tracking-widest uppercase mb-1">CHURN.AI</div>
        <div className="text-sm font-medium text-slate-300">Analytics Platform</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
              active === id
                ? "bg-[#3b5bdb1a] text-[#6c8ef7] border border-[#3b5bdb44]"
                : "text-slate-500 hover:text-slate-300 hover:bg-[#ffffff08]"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-[#232840] text-xs text-slate-600">
        Telco Churn · v1.0
      </div>
    </aside>
  )
}