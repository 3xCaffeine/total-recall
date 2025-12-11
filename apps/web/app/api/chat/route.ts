import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest } from "../../../lib/types/chat";

async function proxyToBackend(request: NextRequest, body: ChatRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const url = `${backendUrl}/api/v1/chat/`;

  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    const cookie = request.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: any = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // leave as text
    }

    return NextResponse.json(parsed, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ChatRequest>;

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    if (!body.user_id || typeof body.user_id !== "string") {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const payload: ChatRequest = {
      prompt: body.prompt,
      user_id: body.user_id,
      session_id: body.session_id ?? undefined,
      previous_chat: body.previous_chat ?? undefined,
    };

    return proxyToBackend(request, payload);
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
