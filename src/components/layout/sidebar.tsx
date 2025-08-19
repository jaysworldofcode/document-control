"use client";

import { Navigation } from "./navigation";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={className}>
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Document Control</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4">
          <div className="px-4">
            <Navigation />
          </div>
        </div>

        {/* Footer */}
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
    </div>
  );
}
