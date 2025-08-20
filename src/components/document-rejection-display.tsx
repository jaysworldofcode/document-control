"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Calendar, 
  User, 
  FileText,
  Download,
  Building
} from "lucide-react";
import { Document } from "@/types/document.types";
import { DocumentRejectionInfo } from "@/types/comment.types";

interface DocumentRejectionDisplayProps {
  document: Document;
}

export function DocumentRejectionDisplay({ document }: DocumentRejectionDisplayProps) {
  // Extract rejection information from the approval workflow
  const rejectionInfo = React.useMemo((): DocumentRejectionInfo | null => {
    if (!document.approvalWorkflow || document.approvalWorkflow.overallStatus !== 'rejected') {
      return null;
    }

    // Find the step that was rejected
    const rejectedStep = document.approvalWorkflow.steps.find(step => step.status === 'rejected');
    if (!rejectedStep) return null;

    return {
      rejectedBy: rejectedStep.approverName,
      rejectedAt: rejectedStep.rejectedAt || '',
      reason: rejectedStep.comments || 'No reason provided',
      step: {
        id: rejectedStep.id,
        approverId: rejectedStep.approverId,
        approverName: rejectedStep.approverName,
        department: rejectedStep.department,
      }
    };
  }, [document]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!rejectionInfo) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          Document Rejected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rejection Overview */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-red-900">Rejection Details</h4>
              <p className="text-sm text-red-700">This document was rejected during the approval process</p>
            </div>
            <Badge variant="destructive">Rejected</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-red-600" />
              <div>
                <span className="text-sm text-red-600">Rejected by</span>
                <p className="font-medium text-red-900">{rejectionInfo.rejectedBy}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <div>
                <span className="text-sm text-red-600">Rejected on</span>
                <p className="font-medium text-red-900">{formatDate(rejectionInfo.rejectedAt)}</p>
              </div>
            </div>

            {rejectionInfo.step && (
              <div className="flex items-center gap-2 md:col-span-2">
                <Building className="h-4 w-4 text-red-600" />
                <div>
                  <span className="text-sm text-red-600">Department</span>
                  <p className="font-medium text-red-900">{rejectionInfo.step.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Reason */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-red-800 whitespace-pre-wrap">{rejectionInfo.reason}</p>
          </div>
        </div>

        {/* Attachments from Rejection */}
        {rejectionInfo.attachments && rejectionInfo.attachments.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-3">Supporting Documents</h4>
            <div className="space-y-2">
              {rejectionInfo.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{attachment.fileName}</p>
                    <p className="text-sm text-red-600">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval Workflow Progress */}
        {document.approvalWorkflow && (
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-3">Approval Workflow Status</h4>
            <div className="space-y-3">
              {document.approvalWorkflow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.status === 'approved' ? 'bg-green-100 text-green-700' :
                      step.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      step.status === 'under-review' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'}`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{step.approverName}</p>
                      <Badge 
                        variant={
                          step.status === 'approved' ? 'success' :
                          step.status === 'rejected' ? 'destructive' :
                          step.status === 'under-review' ? 'warning' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {step.status === 'pending' ? 'Pending' :
                         step.status === 'under-review' ? 'Under Review' :
                         step.status === 'approved' ? 'Approved' :
                         step.status === 'rejected' ? 'Rejected' : step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.department}</p>
                    {step.comments && (
                      <p className="text-sm mt-1 italic text-gray-600">"{step.comments}"</p>
                    )}
                  </div>
                  {step.approvedAt && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(step.approvedAt)}
                      </p>
                    </div>
                  )}
                  {step.rejectedAt && (
                    <div className="text-right">
                      <p className="text-xs text-red-600">
                        {formatDate(step.rejectedAt)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Review the rejection reason and supporting documents</p>
            <p>• Make necessary changes to address the feedback</p>
            <p>• Upload a new version of the document</p>
            <p>• Resubmit for approval when ready</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
