import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({ liked: true }));
  const delta = body.liked ? 1 : -1;
  const listing = await prisma.listing.update({
    where: { id },
    data: { likeCount: { increment: delta } },
  });
  return NextResponse.json({ likeCount: listing.likeCount });
}
