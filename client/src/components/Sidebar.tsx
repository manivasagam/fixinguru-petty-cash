import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Receipt, 
  PlusCircle, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Wallet,
  FileText 
} from "lucide-react";

interface SidebarProps {
  userRole: 'admin' | 'manager' | 'staff';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["admin", "manager", "staff"],
    },
    {
      name: "Submit Expense",
      href: "/submit-expense",
      icon: PlusCircle,
      roles: ["admin", "manager", "staff"],
    },
    {
      name: "Expense History",
      href: "/expenses",
      icon: Receipt,
      roles: ["admin", "manager", "staff"],
    },
    {
      name: "Approvals",
      href: "/approvals",
      icon: CheckCircle,
      roles: ["admin", "manager"],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["admin", "manager"],
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: FileText,
      roles: ["admin", "manager", "staff"],
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Top Up Cash",
      href: "/topup",
      icon: Wallet,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
