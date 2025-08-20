"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface ChatToggleButtonProps {
  isVisible: boolean;
  unreadCount: number;
  onToggle: () => void;
  projectName: string;
}

export function ChatToggleButton({
  isVisible,
  unreadCount,
  onToggle,
  projectName
}: ChatToggleButtonProps) {
  if (isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onToggle}
        className="h-12 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium">Project Chat</div>
            <div className="text-xs opacity-90">{projectName}</div>
          </div>
        </div>
      </Button>
    </div>
  );
}
