import {
  Bell,
  BookOpen,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  PackageCheck,
  PlusSquare,
  Search,
  Settings,
  ShoppingCart,
  UserCircle,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Home, permission: "dashboard" },
  { label: "My Accounts", path: "/profile", icon: UserCircle, permission: "dashboard" },
  { label: "PR Management", path: "/prs", icon: ClipboardList, permission: "prs:read" },
  { label: "PR Management V2", path: "/rfqs", icon: ClipboardCheck, permission: "rfqs:read" },
  { label: "PO Management", path: "/pos", icon: PackageCheck, permission: "pos:read" },
  { label: "Create Requirement", path: "/requirements/new", icon: PlusSquare, permission: "requirements" },
  { label: "Catalogue", path: "/catalogue", icon: Boxes, permission: "catalogue:read" },
  { label: "Contract Management", path: "/contracts", icon: FileText, permission: "contracts:read" },
  { label: "Requirements", path: "/requirements", icon: BookOpen, permission: "requirements:read" },
  { label: "PO's", path: "/pos", icon: ShoppingCart, permission: "pos:read" },
  { label: "Communications", path: "/communications", icon: MessageSquare, permission: "dashboard" },
  { label: "Reports", path: "/reports", icon: FileBarChart, permission: "reports:read" },
  { label: "Settings", path: "/settings", icon: Settings, permission: "settings" }
];

const topTabs = [
  { label: "About", path: "/profile" },
  { label: "My Requirements", path: "/requirements" },
  { label: "Settings", path: "/settings" },
  { label: "My Vendors", path: "/vendors" },
  { label: "Password Management", path: "/password" }
];

export function AppShell() {
  const { user, logout, can } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNav = navItems.filter((item) => can(item.permission));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-[#075a70] text-white shadow-soft lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/15 px-4">
          <div className="grid size-9 place-items-center rounded-md bg-white/15">
            <Building2 data-icon="inline-start" />
          </div>
          <div>
            <p className="text-sm font-semibold">Procure360</p>
            <p className="text-xs text-white/70">Vendor Portal</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={`${item.label}-${item.path}`}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/12 hover:text-white",
                  isActive && "bg-white/16 text-white"
                )}
              >
                <Icon data-icon="inline-start" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="hidden text-lg font-semibold text-primary md:block">Procure360</div>
              <div className="flex h-9 min-w-0 flex-1 max-w-xl items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground">
                <HelpCircle data-icon="inline-start" />
                <span className="hidden sm:inline">Click here to get help</span>
                <span className="sm:hidden">Help</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Search help">
                <Search data-icon="inline-start" />
              </Button>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell data-icon="inline-start" />
              </Button>
              <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.roles.join(", ")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  aria-label="Logout"
                >
                  <LogOut data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex overflow-x-auto border-t bg-card px-4 lg:px-6">
            {topTabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  "min-w-fit border-b-2 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground transition hover:text-primary",
                  location.pathname === tab.path ? "border-primary text-primary" : "border-transparent"
                )}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card p-1 lg:hidden">
        {visibleNav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.label} to={item.path} className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] text-muted-foreground">
              <Icon data-icon="inline-start" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
