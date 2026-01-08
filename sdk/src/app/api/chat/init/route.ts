import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST() {
  try {
    // Demo mode: session id is only used client-side; no server-side persistence.
    const sessionId = randomUUID();

    return NextResponse.json(
      {
        sessionId,
        status: "success",
        message: "Session created successfully",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error creating session:", error);

    return NextResponse.json(
      {
        error: "Failed to create session",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
