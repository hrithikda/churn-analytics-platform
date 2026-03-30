import { useState } from "react"
import Sidebar from "./components/Sidebar"
import Overview from "./pages/Overview"
import Cohorts from "./pages/Cohorts"
import Segments from "./pages/Segments"
import ModelInsights from "./pages/ModelInsights"
import RiskTable from "./pages/RiskTable"

const PAGES = { overview: Overview, cohorts: Cohorts, segments: Segments, model: ModelInsights, risk: RiskTable }

export default function App() {
  const [active, setActive] = useState("overview")
  const Page = PAGES[active] ?? Overview

  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} setActive={setActive} />
      <main className="flex-1 overflow-auto">
        <Page />
      </main>
    </div>
  )
}