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
    <div className="fixed bottom-0 right-8 z-50">
      <div
        onClick={onToggle}
        className="p-2 pl-4 pr-4 min-w-[200px] rounded-tl-lg cursor-pointer rounded-tr-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <div className="w-full">
          {/* <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div> */}
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">👋</span>
            <div className="text-sm font-medium">Project Chat</div>
            {/* <div className="text-xs opacity-90">{projectName}</div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
