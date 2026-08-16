import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Not configured", { status: 500 });

  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok) return new Response("File not found", { status: 404 });

  const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`);
  if (!imgRes.ok) return new Response("File not found", { status: 404 });

  return new Response(imgRes.body, {
    headers: {
      "Content-Type": imgRes.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
