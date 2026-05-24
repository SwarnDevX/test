import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Compile LaTeX via texlive.net (free, reliable, no auth needed).
 * Uses multipart/form-data with the filecontents[]/filename[] convention.
 */
async function compileWithTexlive(latexCode: string): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.append("filecontents[]", latexCode);
  formData.append("filename[]", "resume.tex");
  formData.append("engine", "pdflatex");
  formData.append("return", "pdf");

  const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
    method: "POST",
    body: formData,
    redirect: "follow",
    signal: AbortSignal.timeout(60_000), // texlive can be slow on first run
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`texlive.net returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf")) {
    const text = await res.text().catch(() => "");
    // texlive.net returns HTML error pages — try to extract the log
    const logMatch = text.match(/!\s.+/);
    throw new Error(
      logMatch ? `LaTeX error: ${logMatch[0]}` : "Compilation produced no PDF. Check your LaTeX code."
    );
  }

  return res.arrayBuffer();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { latexCode } = await req.json();
    if (!latexCode?.trim()) {
      return NextResponse.json({ error: "No LaTeX code provided" }, { status: 400 });
    }

    const pdfBuffer = await compileWithTexlive(latexCode);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compilation error";
    console.error("[compile]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
