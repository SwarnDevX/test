import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLatex, getDefaultResumeData } from "@/lib/latex-generator";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      templateId: true,
      profession: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(projects);
}

const createSchema = z.object({
  title: z.string().min(1).max(100),
  templateId: z.string().optional(),
  resumeData: z.any().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { title, templateId, resumeData } = createSchema.parse(body);

    const data = resumeData ?? getDefaultResumeData();
    const latexCode = generateLatex(data);

    const project = await prisma.project.create({
      data: {
        title,
        userId,
        templateId: templateId ?? null,
        resumeData: JSON.stringify(data),
        latexCode,
        profession: data.personalInfo?.name ? undefined : undefined,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
