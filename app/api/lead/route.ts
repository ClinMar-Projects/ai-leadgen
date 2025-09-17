/**
 * Simple webhook endpoint to capture leads.  In a production
 * deployment, replace this with logic to forward submissions to your
 * CRM, mailing list, or other storage.  This route is also an edge
 * function for low latency.
 */
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // TODO: Validate and process the lead data.  You might send it to
    // an external service (Zapier, Airtable, etc.) here.
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}