import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./sidebar.tsx"
import { Topbar } from "./topbar.tsx"

export function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-60">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
