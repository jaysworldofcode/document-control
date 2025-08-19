import { AppLayout } from "@/components/layout";
import { ProjectDetails } from "@/components/project-details";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <AppLayout>
      <ProjectDetails projectId={params.id} />
    </AppLayout>
  );
}
