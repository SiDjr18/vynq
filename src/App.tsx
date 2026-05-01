import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

const CataloguePage = lazy(() => import("@/pages/CataloguePage").then((module) => ({ default: module.CataloguePage })));
const CommunicationsPage = lazy(() => import("@/pages/CommunicationsPage").then((module) => ({ default: module.CommunicationsPage })));
const ContractsPage = lazy(() => import("@/pages/ContractsPage").then((module) => ({ default: module.ContractsPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const DataConnectorsPage = lazy(() => import("@/pages/DataConnectorsPage").then((module) => ({ default: module.DataConnectorsPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const ManufacturersPage = lazy(() => import("@/pages/ManufacturersPage").then((module) => ({ default: module.ManufacturersPage })));
const MaterialIntelligencePage = lazy(() => import("@/pages/MaterialIntelligencePage").then((module) => ({ default: module.MaterialIntelligencePage })));
const MaterialsPage = lazy(() => import("@/pages/MaterialsPage").then((module) => ({ default: module.MaterialsPage })));
const PasswordPage = lazy(() => import("@/pages/PasswordPage").then((module) => ({ default: module.PasswordPage })));
const POPage = lazy(() => import("@/pages/POPage").then((module) => ({ default: module.POPage })));
const PRPage = lazy(() => import("@/pages/PRPage").then((module) => ({ default: module.PRPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const QCSPage = lazy(() => import("@/pages/QCSPage").then((module) => ({ default: module.QCSPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const RequirementsPage = lazy(() => import("@/pages/RequirementsPage").then((module) => ({ default: module.RequirementsPage })));
const RFQPage = lazy(() => import("@/pages/RFQPage").then((module) => ({ default: module.RFQPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const VendorOnboardingPage = lazy(() => import("@/pages/VendorOnboardingPage").then((module) => ({ default: module.VendorOnboardingPage })));
const VendorSupplyNetworkPage = lazy(() => import("@/pages/VendorSupplyNetworkPage").then((module) => ({ default: module.VendorSupplyNetworkPage })));
const VendorsPage = lazy(() => import("@/pages/VendorsPage").then((module) => ({ default: module.VendorsPage })));

function RouteFallback() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/material-intelligence" element={<MaterialIntelligencePage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/manufacturers" element={<ManufacturersPage />} />
            <Route path="/vendor-supply-network" element={<VendorSupplyNetworkPage />} />
            <Route path="/data-connectors" element={<DataConnectorsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/requirements/new" element={<RequirementsPage createMode />} />
            <Route path="/requirements/:id/edit" element={<RequirementsPage createMode />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/new" element={<VendorOnboardingPage />} />
            <Route path="/prs" element={<PRPage />} />
            <Route path="/rfqs" element={<RFQPage />} />
            <Route path="/qcs" element={<QCSPage />} />
            <Route path="/pos" element={<POPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/password" element={<PasswordPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
