"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Document } from "@/types/document.types";
import { DocumentLog, DocumentLogAction } from "@/types/document-log.types";
import { LOG_ACTION_CONFIG } from "@/constants/document-log.constants";
import { 
  Search, 
  Filter,
  Clock,
  User,
  FileText,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Upload,
  Share,
  MessageSquare,
  RefreshCw,
  Lock,
  Unlock,
  History,
  FolderOpen,
  Copy,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle
} from "lucide-react";

interface DocumentLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const actionIcons: Record<DocumentLogAction, any> = {
  upload: Upload,
  download: Download,
  view: Eye,
  edit: Edit,
  status_change: RefreshCw,
  checkout: Lock,
  checkin: Unlock,
  approval: CheckCircle,
  rejection: XCircle,
  version_upload: FileText,
  share: Share,
  comment: MessageSquare,
  delete: Trash2,
  restore: RotateCcw,
  move: FolderOpen,
  copy: Copy,
};

export function DocumentLogsModal({ isOpen, onClose, document }: DocumentLogsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<DocumentLogAction | "all">("all");
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs when modal opens
  useEffect(() => {
    if (isOpen && document) {
      fetchLogs();
    }
  }, [isOpen, document]);

  const fetchLogs = async () => {
    if (!document) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${document.id}/logs`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      
      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: DocumentLog[] } = {};
    
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    
    return groups;
  }, [filteredLogs]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getActionConfig = (action: DocumentLogAction) => {
    return LOG_ACTION_CONFIG[action] || {
      label: action,
      icon: "📄",
      color: "text-gray-600",
      description: `Action: ${action}`
    };
  };

  const renderLogDetails = (log: DocumentLog) => {
    const details = [];
    
    if (log.details.version) {
      details.push(`Version: ${log.details.version}`);
    }
    
    if (log.details.fileName) {
      details.push(`File: ${log.details.fileName}`);
    }
    
    if (log.details.fileSize) {
      const size = log.details.fileSize;
      const formattedSize = size < 1024 * 1024 
        ? `${(size / 1024).toFixed(1)} KB`
        : `${(size / (1024 * 1024)).toFixed(1)} MB`;
      details.push(`Size: ${formattedSize}`);
    }
    
    if (log.details.oldValue && log.details.newValue) {
      details.push(`${log.details.oldValue} → ${log.details.newValue}`);
    }
    
    if (log.details.reason) {
      details.push(`Reason: ${log.details.reason}`);
    }
    
    return details;
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Document Activity Logs
          </DialogTitle>
          <DialogDescription>
            Complete activity history for "{document.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Action: {actionFilter === "all" ? "All" : getActionConfig(actionFilter).label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActionFilter("all")}>
                    All Actions
                  </DropdownMenuItem>
                  {Object.entries(LOG_ACTION_CONFIG).map(([action, config]) => {
                    const IconComponent = actionIcons[action as DocumentLogAction];
                    return (
                      <DropdownMenuItem 
                        key={action} 
                        onClick={() => setActionFilter(action as DocumentLogAction)}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error loading logs: {error}</span>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredLogs.length} of {logs.length} log entries</span>
            <span>
              {logs.length > 0 && (
                <>Latest activity: {formatTime(logs[0]?.timestamp)}</>
              )}
            </span>
          </div>

          {/* Logs Timeline */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-muted-foreground">Loading activity logs...</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground mb-4">
                  No activity has been recorded for this document yet.
                </p>
                <Button onClick={fetchLogs} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No matching logs</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setActionFilter("all");
                  }} 
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, logs]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        {formatDate(logs[0].timestamp)}
                      </h3>
                    </div>

                    {/* Logs for this date */}
                    <div className="space-y-3 pl-4">
                      {logs.map((log, index) => {
                        const ActionIcon = actionIcons[log.action];
                        const config = getActionConfig(log.action);
                        const details = renderLogDetails(log);
                        
                        return (
                          <div key={log.id} className="relative">
                            {/* Timeline line */}
                            {index !== logs.length - 1 && (
                              <div className="absolute left-4 top-8 w-px h-12 bg-border" />
                            )}
                            
                            {/* Log entry */}
                            <div className="flex gap-3">
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center ${config.color}`}>
                                <ActionIcon className="h-4 w-4" />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {config.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(log.timestamp)}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">
                                    {log.details.description}
                                  </p>
                                  
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{log.userName}</span>
                                  </div>
                                  
                                  {details.length > 0 && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      {details.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                          <span>{detail}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Activity logs are automatically generated and cannot be modified
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
