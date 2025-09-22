/**
 * Simple webhook endpoint to capture leads.  In a production
 * deployment, replace this with logic to forward submissions to your
 * CRM, mailing list, or other storage.  This route is also an edge
 * function for low latency.
 */
// Use the Node.js runtime so that we can perform outgoing HTTP requests
// to the Zapier webhook.  The Node runtime can access environment
// variables if needed.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // Forward the lead data to the Zapier webhook.  The payload
    // includes the user's contact info, any note, the array of user
    // responses from the chat, the final answer from the assistant,
    // and the title of the report.  Zapier will parse these fields
    // and trigger further actions in your workflow.
    const webhookUrl = "https://hooks.zapier.com/hooks/catch/5182706/u13v6ag/";
    let ok = true;
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        ok = false;
      }
    } catch (err) {
      ok = false;
    }
    // Always respond to the client to confirm receipt.  The client
    // doesn't need to know if the external webhook failed; errors can be
    // logged and monitored separately.
    return new Response(
      JSON.stringify({ ok }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}