export const dynamic = "force-static";

export async function GET() {
  const parts = Array.from({ length: 43 }, (_, i) => String(i).padStart(2, "0"));
  return Response.json({ parts });
}
