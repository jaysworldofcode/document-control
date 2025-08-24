import { AppLayout } from "@/components/layout";
import { DocumentsTable } from "@/components/documents/documents-table";

export default function Home() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Document Management</h1>
        <DocumentsTable />
      </div>
    </AppLayout>
  );
}
