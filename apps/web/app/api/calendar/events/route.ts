import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  status?: string;
}

interface GoogleCalendarResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get timeMin and timeMax from query params
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get the Google access token from the account table
    const accountResult = await pool.query(
      `SELECT "accessToken", "refreshToken", "accessTokenExpiresAt" 
       FROM "account" 
       WHERE "userId" = $1 AND "providerId" = 'google'`,
      [session.user.id]
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } = accountResult.rows[0];

    // Check if token is expired and refresh if needed
    let currentAccessToken = accessToken;
    const expiresAt = new Date(accessTokenExpiresAt);
    
    if (expiresAt < new Date() && refreshToken) {
      // Refresh the token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        currentAccessToken = tokenData.access_token;
        
        // Update the access token in database
        await pool.query(
          `UPDATE "account" 
           SET "accessToken" = $1, "accessTokenExpiresAt" = $2 
           WHERE "userId" = $3 AND "providerId" = 'google'`,
          [
            tokenData.access_token,
            new Date(Date.now() + tokenData.expires_in * 1000),
            session.user.id,
          ]
        );
      }
    }

    // Fetch calendar events from Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "100",
        }),
      {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error("Google Calendar API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: calendarResponse.status }
      );
    }

    const calendarData: GoogleCalendarResponse = await calendarResponse.json();

    return NextResponse.json({
      events: calendarData.items || [],
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
