// src/components/DashboardLayout.tsx
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Newspaper,
  Receipt, // Icon for Purchases
  Landmark,
  CreditCard,
  Factory,
  BarChart3, // Icon for Accounting group (can be changed)
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// --- Primary Navigation Items ---
const primaryNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
];

// --- Admin Navigation Items ---
const adminNavigation = [
  { name: "Blog Management", href: "/blog-management", icon: Newspaper },
  // Add other admin-specific links here
];

// --- Accounting Navigation Items ---
const accountingNavigation = [
  { name: "Purchases", href: "/accounting/purchases", icon: Receipt },
  //{ name: "Manufacturing Batches", href: "/accounting/batches", icon: Factory },
  //{ name: "Product Costs", href: "/accounting/product-costs", icon: BarChart3 },
  //{    name: "Operational Expenses",href: "/accounting/expenses",icon: CreditCard,},
];

const DashboardLayout = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    return (
      location.pathname === href ||
      (href !== "/" && location.pathname.startsWith(href))
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r">
          <SidebarHeader className="p-4 border-b">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                Bella Egypt
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                admin
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="flex-grow p-0">
            {/* Primary Navigation Group */}
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="px-4">Primary</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primaryNavigation.map((item) => (
                    <SidebarMenuItem key={item.name} className="px-2">
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        isActive={isActive(item.href)}
                        className={`${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Link
                          to={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon
                            className={`h-5 w-5 ${
                              isActive(item.href)
                                ? "text-primary"
                                : "text-muted-foreground group-hover/menu-button:text-accent-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-2" />

            {/* Admin Navigation Group */}
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="px-4">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigation.map((item) => (
                    <SidebarMenuItem key={item.name} className="px-2">
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        isActive={isActive(item.href)}
                        className={`${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Link
                          to={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon
                            className={`h-5 w-5 ${
                              isActive(item.href)
                                ? "text-primary"
                                : "text-muted-foreground group-hover/menu-button:text-accent-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-2" />

            {/* Accounting Navigation Group */}
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="px-4 flex items-center">
                <Landmark className="mr-2 h-4 w-4" /> Accounting
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountingNavigation.map((item) => (
                    <SidebarMenuItem key={item.name} className="px-2">
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        isActive={isActive(item.href)}
                        className={`${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Link
                          to={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon
                            className={`h-5 w-5 ${
                              isActive(item.href)
                                ? "text-primary"
                                : "text-muted-foreground group-hover/menu-button:text-accent-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30">
            <SidebarTrigger className="mb-4 md:hidden" />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
