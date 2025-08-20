"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Users,
  Search,
  Filter,
  GripVertical,
  User,
  Mail,
  Building,
  ArrowRight,
  CheckCircle,
  Clock,
  X,
  Send,
  FileText
} from "lucide-react";
import { Document } from "@/types/document.types";
import { User as UserType, Approver } from "@/types/project.types";

interface SendForApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSubmit: (approvers: Approver[], comments?: string) => Promise<void>;
}

// Mock users data - in real app this would come from API
const MOCK_USERS: UserType[] = [
  { id: 'user_001', name: 'Mario Rodriguez', email: 'mario.rodriguez@company.com', department: 'Engineering', role: 'Senior Manager', isActive: true },
  { id: 'user_002', name: 'Jose Martinez', email: 'jose.martinez@company.com', department: 'Engineering', role: 'Tech Lead', isActive: true },
  { id: 'user_003', name: 'John Smith', email: 'john.smith@company.com', department: 'Quality Assurance', role: 'QA Manager', isActive: true },
  { id: 'user_004', name: 'Jane Wilson', email: 'jane.wilson@company.com', department: 'Compliance', role: 'Compliance Officer', isActive: true },
  { id: 'user_005', name: 'Sarah Kim', email: 'sarah.kim@company.com', department: 'Engineering', role: 'Software Engineer', isActive: true },
  { id: 'user_006', name: 'Michael Brown', email: 'michael.brown@company.com', department: 'Security', role: 'Security Specialist', isActive: true },
  { id: 'user_007', name: 'Lisa Wang', email: 'lisa.wang@company.com', department: 'Business Analysis', role: 'Business Analyst', isActive: true },
  { id: 'user_008', name: 'David Chen', email: 'david.chen@company.com', department: 'Operations', role: 'Operations Manager', isActive: true },
  { id: 'user_009', name: 'Emily Davis', email: 'emily.davis@company.com', department: 'Legal', role: 'Legal Counsel', isActive: true },
  { id: 'user_010', name: 'Robert Johnson', email: 'robert.johnson@company.com', department: 'Finance', role: 'Finance Director', isActive: true },
];

const DEPARTMENTS = ['All', 'Engineering', 'Quality Assurance', 'Compliance', 'Security', 'Business Analysis', 'Operations', 'Legal', 'Finance'];

// Sortable Approver Item Component
function SortableApproverItem({ 
  approver, 
  index, 
  onRemove 
}: { 
  approver: Approver; 
  index: number; 
  onRemove: (id: string) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: approver.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-lg bg-background ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-muted flex items-center gap-2"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {index + 1}
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{approver.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{approver.email}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Building className="h-3 w-3 mr-1" />
          {approver.department}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(approver.id)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SendForApprovalModal({ 
  isOpen, 
  onClose, 
  document, 
  onSubmit 
}: SendForApprovalModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedApprovers, setSelectedApprovers] = useState<Approver[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter users based on search and department
  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === "All" || user.department === selectedDepartment;
      
      const notSelected = !selectedApprovers.some(approver => approver.id === user.id);
      
      return matchesSearch && matchesDepartment && notSelected && user.isActive;
    });
  }, [searchTerm, selectedDepartment, selectedApprovers]);

  // Don't render anything if document is null - moved after all hooks
  if (!document) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedApprovers(prev => {
        const oldIndex = prev.findIndex(approver => approver.id === active.id);
        const newIndex = prev.findIndex(approver => approver.id === over?.id);

        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleAddApprover = (user: UserType) => {
    const approver: Approver = {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      avatar: user.avatar,
    };
    setSelectedApprovers(prev => [...prev, approver]);
  };

  const handleRemoveApprover = (approverId: string) => {
    setSelectedApprovers(prev => prev.filter(approver => approver.id !== approverId));
  };

  const handleSubmit = async () => {
    if (selectedApprovers.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedApprovers, comments);
      onClose();
      setSelectedApprovers([]);
      setComments("");
      setSearchTerm("");
      setSelectedDepartment("All");
    } catch (error) {
      console.error("Failed to send for approval:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedApprovers([]);
    setComments("");
    setSearchTerm("");
    setSelectedDepartment("All");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send for Approval
          </DialogTitle>
          <DialogDescription>
            Select users to approve <strong>{document.name}</strong> and arrange them in the order of approval.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* User Selection Panel */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Available Users</Label>
              
              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept === "All" ? "All Departments" : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User List */}
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2 space-y-2">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => handleAddApprover(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.department}
                      </Badge>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No users found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Selected Approvers Panel */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">
                Approval Sequence ({selectedApprovers.length} approvers)
              </Label>
              
              {selectedApprovers.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      Sequential Approval Process
                    </p>
                    <p>Documents will be approved in the order shown below. Drag to reorder.</p>
                  </div>

                  <ScrollArea className="h-64">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedApprovers.map(approver => approver.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {selectedApprovers.map((approver, index) => (
                            <SortableApproverItem
                              key={approver.id}
                              approver={approver}
                              index={index}
                              onRemove={handleRemoveApprover}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                  <ArrowRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select users from the left to add them to the approval sequence</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-2">
          <Label htmlFor="comments">Comments (Optional)</Label>
          <Textarea
            id="comments"
            placeholder="Add any additional comments or instructions for the approvers..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedApprovers.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send for Approval ({selectedApprovers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
