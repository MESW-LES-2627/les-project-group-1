import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {Navigate, Route, Routes} from "react-router-dom";
import {AuthProvider, useAuth} from "@/context/auth-context.tsx";
import Login from "@/dashboard/pages/login.tsx";
import { ProtectedRoute } from "@/dashboard/components/layout/protected-route.tsx";
import { AppLayout } from "@/dashboard/components/layout/app-layout.tsx";
import Overview from "@/dashboard/pages/overview.tsx";
import Users from "@/dashboard/pages/users.tsx";
import Clubs from "@/dashboard/pages/clubs.tsx";
import Placeholder from "@/dashboard/pages/placeholder.tsx";
import "@/dashboard/index.css";
import CharitableOrganizations from "@/dashboard/pages/charitable-organizations.tsx";
import {RoleRoute} from "@/dashboard/components/layout/role-route.tsx";
import MyListings from "@/dashboard/pages/my-listings.tsx";
import ClubProfilePage from "@/dashboard/pages/club-profile.tsx";
import AdminListings from "@/dashboard/pages/admin-listings.tsx";
const queryClient = new QueryClient();

// /dashboard: admins see the overview, clubs go straight to their listings
function DashboardIndex() {
    const { user } = useAuth();
    if (user?.role === "CLUB") return <Navigate to="/dashboard/listings" replace />;
    return <Overview />;
}

// /dashboard/listings: admins review every club's listings, a club manages its own.
// One route for both, because two routes with the same path only ever match the first one.
function ListingsPage() {
    const { user } = useAuth();
    return user?.role === "ADMIN" ? <AdminListings /> : <MyListings />;
}
export default function DashboardRoutes() {
    useEffect(() => {
        document.body.classList.add("dashboard-theme");
        return () => document.body.classList.remove("dashboard-theme");
    }, []);

    return (

    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Routes>
                <Route path="login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    {/* Buyers have no dashboard: RoleRoute sends them back to the site */}
                    <Route element={<RoleRoute allow={["ADMIN", "CLUB"]} />}>
                        <Route element={<AppLayout />}>
                            <Route index element={<DashboardIndex />} />
                            <Route path="listings" element={<ListingsPage />} />

                            <Route element={<RoleRoute allow={["ADMIN"]} />}>
                                <Route path="users" element={<Users />} />
                                <Route path="clubs" element={<Clubs />} />
                                <Route path="charitable-organizations" element={<CharitableOrganizations />} />
                                <Route path="analytics" element={<Placeholder title="Analytics" />} />
                                <Route path="settings" element={<Placeholder title="Settings" />} />

                            </Route>

                            <Route element={<RoleRoute allow={["CLUB"]} />}>
                                <Route path="club" element={<ClubProfilePage />} />
                            </Route>
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </AuthProvider>
    </QueryClientProvider>

    );
}