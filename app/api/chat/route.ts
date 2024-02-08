import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

import arcjet, { rateLimit } from "@arcjet/next";
import { NextResponse } from "next/server";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The arcjet instance is created outside of the handler
const aj = arcjet({
  // Get your site key from https://app.arcjet.com
  // and set it as an environment variable rather than hard coding.
  // See: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
  key: process.env.ARCJET_KEY!,
  rules: [
    rateLimit({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      window: "1m", // counts requests over a 1 minute window
      max: 1, // allows 1 request within the window
      timeout: "10m", // blocks requests for 10 min after hitting the limit
    }),
  ],
});
// Set the runtime to edge for best performance
export const runtime = "edge";

export async function POST(req: Request) {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Too Many Requests", reason: decision.reason },
      { status: 429 }
    );
  }
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
