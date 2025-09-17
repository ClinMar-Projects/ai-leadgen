import type { NextRequest } from "next/server";

/**
 * This API route proxies questions to the OpenAI responses API and
 * streams answers back to the client.  It is deployed as an edge
 * function to reduce latency.  The system prompt defines the tone
 * and safety guidance for responses.
 */
// Use the Node.js runtime instead of the default edge runtime.  The Node
// runtime has access to environment variables defined in `.env.local` by
// default.  This change ensures the OpenAI API key is available in
// process.env.OPENAI_API_KEY.
export const runtime = "nodejs";

// Define the default system prompt used for all requests.  This
// prompt instructs the model to provide concise, friendly answers,
// emphasises self-care for physical therapy issues, and warns users
// when they should seek in-person evaluation.
const SYSTEM = `You are a helpful assistant for a physical therapy lead-gen site. Answer clearly in 4-8 sentences max, actionable, friendly, and avoid diagnosis. Encourage safe self-care and prompt in-person evaluation when red flags appear (severe pain, numbness, loss of bowel/bladder control, fever, recent trauma, or worsening symptoms). Stay non-judgmental. If users ask about scheduling or clinic details, politely say you can connect them with a human if contact info is provided.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    // Use the model from the environment if provided.  Fall back to a widely
    // available model (gpt-3.5-turbo) instead of gpt-4o-mini to reduce
    // the chance of unsupported model errors.
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    if (!apiKey) {
      return new Response("Missing OpenAI API key", { status: 500 });
    }

    // If the client provides a messages array, assume it contains the full
    // conversation history including the system prompt.  Otherwise,
    // fall back to a single message string.
    let messages: Array<{ role: string; content: string }> | undefined;
    if (Array.isArray(body?.messages)) {
      messages = body.messages;
    }

    let payload;
    if (messages) {
      payload = {
        model,
        messages,
        // Disable streaming so the response is returned as a single JSON object
        stream: false,
      };
    } else {
      const message = body?.message;
      if (!message || typeof message !== "string") {
        return new Response("Bad request", { status: 400 });
      }
      payload = {
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: message },
        ],
        stream: false,
      };
    }

    const fetchResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!fetchResponse.ok) {
      const text = await fetchResponse.text().catch(() => "");
      return new Response(`Upstream error: ${text}`, { status: 500 });
    }
    // Parse the JSON result and return only the assistant's message content
    const data = await fetchResponse.json();
    const firstChoice = data?.choices?.[0];
    const assistantMsg = firstChoice?.message?.content || "";
    return new Response(assistantMsg, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(`Server error: ${String(e)}`, { status: 500 });
  }
}