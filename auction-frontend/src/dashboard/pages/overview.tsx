import { CreditCard, DollarSign, Users, Activity } from "lucide-react"
import { StatCard } from "@/dashboard/components/dashboard/stat-card"
import { RevenueChart } from "@/dashboard/components/dashboard/revenue-chart"
import { RecentOrders } from "@/dashboard/components/dashboard/recent-orders"

export default function Overview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total revenue" value="$45,231" change="+20.1% from last month" icon={DollarSign} />
        <StatCard title="Customers" value="2,350" change="+180 this month" icon={Users} />
        <StatCard title="Orders" value="12,234" change="+19% from last month" icon={CreditCard} />
        <StatCard title="Active now" value="573" change="+201 since last hour" icon={Activity} />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <RevenueChart />
        <RecentOrders />
      </div>
    </div>
  )
}
