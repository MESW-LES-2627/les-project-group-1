import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context.tsx";
import Login from "@/dashboard/pages/login.tsx";
import { ProtectedRoute } from "@/dashboard/components/layout/protected-route.tsx";
import { AppLayout } from "@/dashboard/components/layout/app-layout.tsx";
import Overview from "@/dashboard/pages/overview.tsx";
import Users from "@/dashboard/pages/users.tsx";
import Placeholder from "@/dashboard/pages/placeholder.tsx";
const queryClient = new QueryClient();


export default function DashboardRoutes() {
    return (

        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Routes>
                    <Route path="login" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route index element={<Overview />} />
                            <Route path="users" element={<Users />} />
                            <Route path="analytics" element={<Placeholder title="Analytics" />} />
                            <Route path="settings" element={<Placeholder title="Settings" />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </QueryClientProvider>

    );
}