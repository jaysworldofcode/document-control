"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Archive,
  ClipboardList,
  Building,
  UserCheck
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: ClipboardList,
  },
  {
    title: "Organizations",
    href: "/organizations",
    icon: Building,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: UserCheck,
  },
  {
    title: "Archive",
    href: "/archive",
    icon: Archive,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface NavigationProps {
  className?: string;
  onItemClick?: () => void;
}

export function Navigation({ className, onItemClick }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground focus:outline-none",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
