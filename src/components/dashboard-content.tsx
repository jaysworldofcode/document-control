"use client";

import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users, 
  ClipboardList, 
  TrendingUp,
  Plus,
  Search,
  Filter
} from "lucide-react";

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your document management system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+12%</span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">23</p>
            </div>
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">+3</span>
            <span className="text-muted-foreground ml-1">new this week</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team Members</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-blue-500">+8</span>
            <span className="text-muted-foreground ml-1">this month</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">18</p>
            </div>
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-500">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              {
                name: "Project Requirements Document",
                type: "PDF",
                modified: "2 hours ago",
                author: "John Doe",
                status: "Published"
              },
              {
                name: "Technical Specification",
                type: "DOCX",
                modified: "4 hours ago",
                author: "Jane Smith",
                status: "In Review"
              },
              {
                name: "User Manual v2.1",
                type: "PDF",
                modified: "1 day ago",
                author: "Mike Johnson",
                status: "Draft"
              },
              {
                name: "API Documentation",
                type: "MD",
                modified: "2 days ago",
                author: "Sarah Wilson",
                status: "Published"
              }
            ].map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} • Modified {doc.modified} by {doc.author}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      doc.status === "Published" 
                        ? "bg-green-100 text-green-800" 
                        : doc.status === "In Review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
