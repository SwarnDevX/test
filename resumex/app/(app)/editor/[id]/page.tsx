import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditorLayout } from "@/components/editor/EditorLayout";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: (session!.user as { id: string }).id },
  });

  if (!project) notFound();

  const resumeData = JSON.parse(project.resumeData || "{}");

  return (
    <EditorLayout
      projectId={project.id}
      initialTitle={project.title}
      initialResumeData={resumeData}
      initialLatexCode={project.latexCode}
    />
  );
}
