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
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
}

interface GoogleCalendarResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

async function getAccessToken(userId: string) {
  const accountResult = await pool.query(
    `SELECT "accessToken", "refreshToken", "accessTokenExpiresAt" 
     FROM "account" 
     WHERE "userId" = $1 AND "providerId" = 'google'`,
    [userId]
  );

  if (accountResult.rows.length === 0) {
    return null;
  }

  const { accessToken, refreshToken, accessTokenExpiresAt } = accountResult.rows[0];
  let currentAccessToken = accessToken;
  const expiresAt = new Date(accessTokenExpiresAt);

  if (expiresAt < new Date() && refreshToken) {
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

      await pool.query(
        `UPDATE "account" 
         SET "accessToken" = $1, "accessTokenExpiresAt" = $2 
         WHERE "userId" = $3 AND "providerId" = 'google'`,
        [
          tokenData.access_token,
          new Date(Date.now() + tokenData.expires_in * 1000),
          userId,
        ]
      );
    }
  }

  return currentAccessToken;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

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
          Authorization: `Bearer ${accessToken}`,
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

// Create a new event
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { summary, description, location, startDateTime, endDateTime, allDay } = body;

    const event: Record<string, unknown> = {
      summary,
      description,
      location,
    };

    if (allDay) {
      // For all-day events, use date instead of dateTime
      // End date must be the day AFTER the last day of the event for Google Calendar
      const startDate = startDateTime.split("T")[0];
      const endDateObj = new Date(endDateTime);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split("T")[0];
      event.start = { date: startDate };
      event.end = { date: endDate };
    } else {
      event.start = { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      event.end = { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    }

    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error("Google Calendar API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: calendarResponse.status }
      );
    }

    const createdEvent = await calendarResponse.json();
    return NextResponse.json({ event: createdEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update an event
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { eventId, summary, description, location, startDateTime, endDateTime, allDay } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const event: Record<string, unknown> = {
      summary,
      description,
      location,
    };

    if (allDay) {
      // For all-day events, end date must be the day AFTER the last day
      const startDate = startDateTime.split("T")[0];
      const endDateObj = new Date(endDateTime);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split("T")[0];
      event.start = { date: startDate };
      event.end = { date: endDate };
    } else {
      event.start = { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      event.end = { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    }

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error("Google Calendar API error:", errorData);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: calendarResponse.status }
      );
    }

    const updatedEvent = await calendarResponse.json();
    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete an event
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok && calendarResponse.status !== 204) {
      const errorData = await calendarResponse.json();
      console.error("Google Calendar API error:", errorData);
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: calendarResponse.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
