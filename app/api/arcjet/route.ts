import arcjet, { rateLimit } from "@arcjet/next";
import { NextResponse } from "next/server";

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

export async function GET(req: Request) {
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Too Many Requests", reason: decision.reason },
      { status: 429 }
    );
  }

  return NextResponse.json({ message: "Hello world" });
}
