import { NextRequest, NextResponse } from "next/server";
import type { JournalEntry, UpdateJournalEntryRequest } from "@/lib/types/journal";

// Helper function to proxy requests to backend
async function proxyToBackend(
  request: NextRequest,
  method: string,
  entryId: string,
  body?: any
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const url = `${backendUrl}/api/v1/journal/${entryId}`;

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

// GET /api/journal/[id] - Get a specific journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const entryId = params.id;

  // Validate entry ID
  const id = parseInt(entryId);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid entry ID" },
      { status: 400 }
    );
  }

  return proxyToBackend(request, "GET", entryId);
}

// PUT /api/journal/[id] - Update a journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const entryId = params.id;

  // Validate entry ID
  const id = parseInt(entryId);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid entry ID" },
      { status: 400 }
    );
  }

  try {
    const body: UpdateJournalEntryRequest = await request.json();

    // Basic validation
    if (body.title && typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title must be a string if provided" },
        { status: 400 }
      );
    }

    if (body.content && typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string if provided" },
        { status: 400 }
      );
    }

    return proxyToBackend(request, "PUT", entryId, body);
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE /api/journal/[id] - Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const entryId = params.id;

  // Validate entry ID
  const id = parseInt(entryId);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid entry ID" },
      { status: 400 }
    );
  }

  return proxyToBackend(request, "DELETE", entryId);
}