import { LogOut, Menu, Moon, Search, Sun } from "lucide-react"
import { Badge } from "@/dashboard/components/ui/badge.tsx"
import { Button } from "@/dashboard/components/ui/button.tsx"
import { Input } from "@/dashboard/components/ui/input.tsx"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/dashboard/hooks/use-theme"

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu />
      </Button>
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Search" className="pl-8" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {user && (
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="font-medium">{user.username}</span>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
