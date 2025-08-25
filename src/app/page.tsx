"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { DocumentsTable } from "@/components/documents/documents-table";
import { 
  FileText, 
  Users, 
  ClipboardList, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

// Types for our statistics
interface DocumentStats {
  totalDocuments: number;
  pendingApprovals: number;
  recentlyModified: number;
  documentsByStatus: {
    draft: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
}

interface UserStats {
  totalUsers: number;
}

export default function Home() {
  const [docStats, setDocStats] = useState<DocumentStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll simulate a fetch with some dummy data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDocStats({
          totalDocuments: 1234,
          pendingApprovals: 18,
          recentlyModified: 47,
          documentsByStatus: {
            draft: 234,
            under_review: 78,
            approved: 876,
            rejected: 46
          }
        });
        
        setProjectStats({
          totalProjects: 35,
          activeProjects: 23
        });
        
        setUserStats({
          totalUsers: 156
        });
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Stats Header Section */}
        <div className="bg-white mb-6">
          {/* <h1 className="text-2xl font-bold mb-2">Document Control Dashboard</h1> */}
          <p className="text-muted-foreground mb-6">
            Overview of your document management system as of {new Date().toLocaleDateString()}
          </p>
          
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{loading ? "..." : docStats?.totalDocuments.toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+12%</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{loading ? "..." : projectStats?.activeProjects}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-indigo-500 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Out of {projectStats?.totalProjects} total projects</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold">{loading ? "..." : docStats?.pendingApprovals}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-500">Requires attention</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recently Modified</p>
                  <p className="text-2xl font-bold">{loading ? "..." : docStats?.recentlyModified}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-muted-foreground">Updated in the last 7 days</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Documents Table */}
        <DocumentsTable />
      </div>
    </AppLayout>
  );
}
