"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Navigation } from "./navigation";
import { 
  Menu, 
  Bell, 
  Search,
  User,
  LogOut,
  Settings,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Debug info
  console.log("Auth user in header:", user);
  
  // Function to get user initials
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className={className}>
      <div className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
        {/* Left side - Mobile menu + Logo (hidden on desktop) */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex h-full flex-col">
                {/* Mobile logo */}
                <div className="flex h-16 items-center border-b px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold">Document Control</span>
                  </div>
                </div>
                
                {/* Mobile navigation */}
                <div className="flex-1 overflow-auto py-4">
                  <div className="px-4">
                    <Navigation onItemClick={() => setMobileMenuOpen(false)} />
                  </div>
                </div>

                {/* Mobile footer */}
                <div className="border-t p-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      Document Management System
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Version 1.0.0
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop logo (hidden on mobile) */}
          {/* <div className="hidden lg:flex items-center gap-2">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div> */}
        </div>

        {/* Center - Search (hidden on mobile) */}
        {/* <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search documents..."
              className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div> */}

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          {/* <Button
            variant="outline"
            size="icon"
            className="relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive"></span>
            <span className="sr-only">Notifications</span>
          </Button> */}

          {/* User menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`} 
                    className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  />
                ) : (
                  <span className="text-primary-foreground text-sm font-medium cursor-pointer">
                    {getUserInitials()}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
