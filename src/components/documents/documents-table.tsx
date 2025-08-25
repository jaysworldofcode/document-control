"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, Search, X, Info, Eye, History, FileText, ExternalLink, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentViewModal } from "@/components/forms/document-view-modal";
import { VersionHistoryModal } from "@/components/forms/version-history-modal";
import { DocumentLogsModal } from "@/components/forms/document-logs-modal";
import { Document as BaseDocument } from "@/types/document.types";

// Extended document interface with project name from API
interface Document extends BaseDocument {
  projectName: string;
}

interface DocumentsTableProps {
  className?: string;
}

interface Project {
  id: string;
  name: string;
  custom_fields?: CustomField[];
}

interface CustomField {
  id: string;
  name: string;
  type: string;
  label: string;
}



interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function DocumentsTable({ className }: DocumentsTableProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCustomFields, setAllCustomFields] = useState<CustomField[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null);
  const [logsDocument, setLogsDocument] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(projectId && projectId !== 'all' && { projectId }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/documents/list?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch documents"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);

      // Collect all unique custom fields from all projects
      const customFieldsMap = new Map<string, CustomField>();
      data.forEach((project: Project) => {
        if (project.custom_fields) {
          project.custom_fields.forEach((field: CustomField) => {
            if (field.id && field.name && !customFieldsMap.has(field.id)) {
              customFieldsMap.set(field.id, field);
            }
          });
        }
      });
      setAllCustomFields(Array.from(customFieldsMap.values()));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, [pagination.page, pagination.pageSize, sortBy, sortOrder]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDocuments();
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setProjectId('all');
    setStartDate(null);
    setEndDate(null);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDocuments();
  };

  const exportToCsv = () => {
    // Get the unique custom fields from all documents with values
    const allCustomFieldKeys = new Set<string>();
    
    // Gather all custom field keys from documents
    documents.forEach(doc => {
      if (doc.customFieldValues) {
        Object.keys(doc.customFieldValues).forEach(key => {
          allCustomFieldKeys.add(key);
        });
      }
    });
    
    // Map custom field keys to their labels if possible
    const customFieldHeaders = Array.from(allCustomFieldKeys);
    const customFieldLabels = customFieldHeaders.map(key => {
      // Find the custom field definition in allCustomFields
      const fieldDef = allCustomFields.find(field => field.id === key);
      return fieldDef ? fieldDef.label || fieldDef.name : key;
    });
    
    // Create header with base fields plus custom fields
    const baseHeaders = ['Name', 'File Name', 'Status', 'Uploaded By', 'Upload Date', 'Project', 'Type', 'Size'];
    const headers = [...baseHeaders, ...customFieldLabels];
    
    const rows = documents.map(doc => {
      // Create base row data
      const baseRowData = [
        `"${doc.name || ''}"`,
        `"${doc.fileName || ''}"`,
        `"${doc.status || ''}"`,
        `"${doc.uploadedBy || ''}"`,
        `"${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}"`,
        `"${doc.projectName || ''}"`,
        `"${doc.fileType || ''}"`,
        `"${doc.fileSize ? (doc.fileSize / 1024).toFixed(2) + ' KB' : ''}"`,
      ];
      
      // Add custom field values
      const customFieldValues = customFieldHeaders.map(key => {
        const value = doc.customFieldValues && doc.customFieldValues[key];
        if (value === null || value === undefined) return '""';
        
        // If the value is an object or array, stringify it
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        // Escape quotes in string values
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      
      return [...baseRowData, ...customFieldValues].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Action handlers
  const handleDownloadDocument = (document: Document) => {
    console.log("Downloading document:", document.fileName);
    // In a real app, this would construct the actual download URL
    const link = window.document.createElement('a');
    link.href = document.sharePointPath || '#';
    link.download = document.fileName;
    link.click();
  };

  const handleOpenInSharePoint = (document: Document) => {
    console.log("Opening in SharePoint:", document.fileName);
    if (document.sharePointPath) {
      window.open(document.sharePointPath, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "SharePoint path not available",
        description: "This document doesn't have a SharePoint path configured.",
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                placeholder="Search documents, filenames, and custom fields..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                title="Search by document name, file name, or any custom field value"
                className="flex-1"
              />
              {allCustomFields.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Searchable Fields</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Document Fields:</p>
                          <p className="text-xs text-muted-foreground">Document Name, File Name</p>
                        </div>
                        {allCustomFields.length > 0 && (
                          <div>
                            <p className="text-sm font-medium">Custom Fields:</p>
                            <div className="grid gap-1">
                              {allCustomFields.map((field) => (
                                <p key={field.id} className="text-xs text-muted-foreground">
                                  • {field.name} ({field.type})
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Search works across all field values. For example, if you have a "Document ID" field with value "DOC-123", searching for "DOC-123" will find that document.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[180px]",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={(date: Date | undefined) => setStartDate(date || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[180px]",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={(date: Date | undefined) => setEndDate(date || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>

        <Button variant="outline" onClick={exportToCsv}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium capitalize",
                      {
                        "bg-gray-100": doc.status === "draft",
                        "bg-yellow-100": doc.status === "pending_review",
                        "bg-blue-100": doc.status === "under_review",
                        "bg-green-100": doc.status === "approved",
                        "bg-red-100": doc.status === "rejected"
                      },
                    )}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{doc.projectName}</TableCell>
                  <TableCell className="capitalize">{doc.uploadedBy}</TableCell>
                  <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{doc.fileType}</TableCell>
                  <TableCell>{(doc.fileSize / 1024).toFixed(2)} KB</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVersionHistoryDocument(doc)}>
                          <History className="h-4 w-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLogsDocument(doc)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Activity Logs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenInSharePoint(doc)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in SharePoint
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
          {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
          {pagination.totalCount} documents
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      <DocumentViewModal
        isOpen={viewingDocument !== null}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
      />

      <VersionHistoryModal
        isOpen={versionHistoryDocument !== null}
        onClose={() => setVersionHistoryDocument(null)}
        document={versionHistoryDocument}
      />

      <DocumentLogsModal
        isOpen={logsDocument !== null}
        onClose={() => setLogsDocument(null)}
        document={logsDocument}
      />
    </div>
  );
}
