export const dynamic = "force-static";

export async function GET() {
  return Response.json({ error: "live catalog disabled" }, { status: 410 });
}
