"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { DocumentsTable } from "@/components/documents/documents-table";

export default function MyDocumentsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">My Documents</h1>
        <DocumentsTable />
      </div>
    </AppLayout>
  );
}
