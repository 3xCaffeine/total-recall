import { NextRequest, NextResponse } from "next/server";
import type { JournalEntry, CreateJournalEntryRequest } from "@/lib/types/journal";

// Helper function to proxy requests to backend
async function proxyToBackend(
  request: NextRequest,
  method: string,
  path: string = "",
  body?: any
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const url = `${backendUrl}/api/v1/journal${path}`;

  try {
    const headers = new Headers();

    // Forward content-type if provided
    if (request.headers.get("content-type")) {
      headers.set("content-type", request.headers.get("content-type")!);
    }

    // Forward cookies for authentication
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Forward the response
    const responseBody = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }

    return NextResponse.json(parsedBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

// GET /api/journal - List user's journal entries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get("skip") || "0";
  const limit = searchParams.get("limit") || "100";

  const queryParams = new URLSearchParams({ skip, limit });

  return proxyToBackend(request, "GET", `?${queryParams.toString()}`);
}

// POST /api/journal - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const body: CreateJournalEntryRequest = await request.json();

    // Basic validation
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 }
      );
    }

    if (body.title && typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title must be a string if provided" },
        { status: 400 }
      );
    }

    return proxyToBackend(request, "POST", "/", body);
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}