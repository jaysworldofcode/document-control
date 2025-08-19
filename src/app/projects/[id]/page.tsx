import { AppLayout } from "@/components/layout";
import { ProjectDetails } from "@/components/project-details";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  
  return (
    <AppLayout>
      <ProjectDetails projectId={id} />
    </AppLayout>
  );
}
