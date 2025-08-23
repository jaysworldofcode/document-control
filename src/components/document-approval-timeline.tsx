"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, User2, Eye, ArrowRight } from "lucide-react";

interface ApprovalStep {
  id: string;
  approver: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  step_order: number;
  comments?: string;
  approved_at?: string;
  rejected_at?: string;
  viewed_document: boolean;
}

interface ApprovalWorkflow {
  id: string;
  document_id: string;
  current_step: number;
  total_steps: number;
  overall_status: 'pending' | 'under-review' | 'approved' | 'rejected';
  document_approval_steps: ApprovalStep[];
}

interface DocumentApprovalTimelineProps {
  workflow: ApprovalWorkflow | null;
}

export function DocumentApprovalTimeline({ workflow }: DocumentApprovalTimelineProps) {
  if (!workflow) return null;

  const sortedSteps = [...workflow.document_approval_steps].sort((a, b) => a.step_order - b.step_order);

  const getStepStatusColor = (step: ApprovalStep) => {
    if (step.status === 'approved') return 'bg-green-500';
    if (step.status === 'rejected') return 'bg-red-500';
    if (step.step_order === workflow.current_step) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getStepStatusBorderColor = (step: ApprovalStep) => {
    if (step.status === 'approved') return 'border-green-500';
    if (step.status === 'rejected') return 'border-red-500';
    if (step.step_order === workflow.current_step) return 'border-blue-500';
    return 'border-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={
            workflow.overall_status === 'approved' ? 'success' :
            workflow.overall_status === 'rejected' ? 'destructive' :
            workflow.overall_status === 'under-review' ? 'info' : 'warning'
          }>
            {workflow.overall_status.replace('-', ' ').toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Step {workflow.current_step} of {workflow.total_steps}
          </span>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line connecting steps */}
        <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-gray-200" />

        {/* Steps */}
        <div className="space-y-8">
          {sortedSteps.map((step, index) => {
            const isCurrentStep = step.step_order === workflow.current_step;
            const isPending = step.status === 'pending';
            const isApproved = step.status === 'approved';
            const isRejected = step.status === 'rejected';
            const isUpcoming = step.step_order > workflow.current_step;
            const isLastStep = index === sortedSteps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Step content */}
                <div className={cn(
                  "relative flex items-start gap-4 rounded-lg border p-4",
                  isCurrentStep && "bg-blue-50 border-blue-200",
                  isApproved && "bg-green-50 border-green-200",
                  isRejected && "bg-red-50 border-red-200",
                  isUpcoming && "bg-gray-50 border-gray-200"
                )}>
                  {/* Status indicator */}
                  <div className={cn(
                    "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                    getStepStatusBorderColor(step)
                  )}>
                    {isApproved && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                    {isRejected && <XCircle className="h-6 w-6 text-red-500" />}
                    {isPending && isCurrentStep && <Clock className="h-6 w-6 text-blue-500" />}
                    {isPending && !isCurrentStep && <User2 className="h-6 w-6 text-gray-400" />}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {step.approver.first_name} {step.approver.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.approver.email}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Step {step.step_order} of {workflow.total_steps}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      {isCurrentStep && (
                        <Badge variant="info">Current Approver</Badge>
                      )}
                      {step.viewed_document && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          Viewed
                        </div>
                      )}
                      {isApproved && (
                        <Badge variant="success">
                          Approved {step.approved_at && formatDate(step.approved_at)}
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="destructive">
                          Rejected {step.rejected_at && formatDate(step.rejected_at)}
                        </Badge>
                      )}
                      {isPending && !isCurrentStep && (
                        <Badge variant="secondary">Upcoming</Badge>
                      )}
                    </div>

                    {/* Comments */}
                    {step.comments && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-muted-foreground">Comments:</p>
                        <p className="mt-1 text-sm">{step.comments}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector arrow */}
                {!isLastStep && (
                  <div className="absolute left-[22px] -bottom-6 z-20">
                    <ArrowRight className="h-4 w-4 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}