import { NextResponse } from "next/server";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";

export async function GET() {
  return NextResponse.json(BUILT_IN_TEMPLATES);
}
