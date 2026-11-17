import { useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { getErrorMessage } from "@/lib/http"
import { Button } from "@/dashboard/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/dashboard/components/ui/card"
import { Input } from "@/dashboard/components/ui/input"

export default function Login() {
  const { token, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const signIn = useMutation({
    mutationFn: () => login(email, password),
  })

  // Already signed in (or just signed in): go back to where the user was heading
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/"
  if (token) return <Navigate to={from} replace />

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    signIn.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Enter your email and password to open the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {signIn.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getErrorMessage(signIn.error, "Couldn’t sign in. Check your details and try again.")}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={signIn.isPending}>
              {signIn.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
