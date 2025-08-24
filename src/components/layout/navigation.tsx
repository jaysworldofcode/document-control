"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApprovalsCount } from "@/hooks/useApprovalsCount";
import { cn } from "@/lib/utils";
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Archive,
  ClipboardList,
  Building,
  UserCheck,
  MessageCircle
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "My Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: ClipboardList,
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
    title: "Messages",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    title: "Archive",
    href: "/archive",
    icon: Archive,
  },
  {
    title: "Role & Departments",
    href: "/role-department",
    icon: UserCheck,
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
  const { count: approvalsCount, loading: loadingApprovals } = useApprovalsCount();

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const showCounter = item.href === '/approvals' && approvalsCount > 0;
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
            <span className="flex-1">{item.title}</span>
            {showCounter && (
              <span className="flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {approvalsCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
