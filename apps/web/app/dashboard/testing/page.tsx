"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Calendar, User, Settings } from "lucide-react";

interface TestResult {
  endpoint: string;
  status: "idle" | "loading" | "success" | "error";
  data?: any;
  error?: string;
}

export default function TestingPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({
    authMe: { endpoint: "/api/v1/auth/me", status: "idle" },
    authSession: { endpoint: "/api/v1/auth/session", status: "idle" },
    authAccounts: { endpoint: "/api/v1/auth/accounts", status: "idle" },
    calendarEvents: { endpoint: "/api/v1/calendar/events", status: "idle" },
  });

  const updateResult = (key: string, updates: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const testEndpoint = async (key: string, url: string, options: RequestInit = {}) => {
    updateResult(key, { status: "loading" });

    try {
      const response = await fetch(url, {
        credentials: "include", // Important: sends session cookies
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        updateResult(key, { status: "success", data });
      } else {
        updateResult(key, {
          status: "error",
          error: data?.detail || `HTTP ${response.status}: ${response.statusText}`,
          data
        });
      }
    } catch (error) {
      updateResult(key, {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const testAuthMe = () => testEndpoint("authMe", "http://localhost:8000/api/v1/auth/me");
  const testAuthSession = () => testEndpoint("authSession", "http://localhost:8000/api/v1/auth/session");
  const testAuthAccounts = () => testEndpoint("authAccounts", "http://localhost:8000/api/v1/auth/accounts");
  const testCalendarEvents = () => testEndpoint("calendarEvents", "http://localhost:8000/api/v1/calendar/events");

  const testCreateCalendarEvent = async () => {
    const key = "createEvent";
    updateResult(key, { status: "loading", endpoint: "/api/v1/calendar/events (POST)" });

    const eventData = {
      summary: "Test Event from Total Recall",
      description: "This is a test event created from the testing page",
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        timeZone: "UTC",
      },
    };

    await testEndpoint(key, "http://localhost:8000/api/v1/calendar/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const renderResult = (result: TestResult) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getStatusIcon(result.status)}
        <code className="text-sm font-mono">{result.endpoint}</code>
        {result.status === "success" && (
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            {result.data ? "OK" : "No Data"}
          </Badge>
        )}
        {result.status === "error" && (
          <Badge variant="destructive">
            Error
          </Badge>
        )}
      </div>

      {result.error && (
        <Alert variant="destructive">
          <AlertDescription className="font-mono text-sm">
            {result.error}
          </AlertDescription>
        </Alert>
      )}

      {result.data && (
        <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-40">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Backend API Testing</h1>
        <p className="text-muted-foreground">
          Test your backend authentication and calendar endpoints. Make sure you're logged in and your backend is running on port 8000.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Authentication Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Tests
            </CardTitle>
            <CardDescription>
              Test user authentication and session management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testAuthMe} disabled={results.authMe.status === "loading"}>
                Test /me
              </Button>
              <Button onClick={testAuthSession} disabled={results.authSession.status === "loading"}>
                Test /session
              </Button>
              <Button onClick={testAuthAccounts} disabled={results.authAccounts.status === "loading"}>
                Test /accounts
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              {renderResult(results.authMe)}
              {renderResult(results.authSession)}
              {renderResult(results.authAccounts)}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Tests
            </CardTitle>
            <CardDescription>
              Test Google Calendar API integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testCalendarEvents} disabled={results.calendarEvents.status === "loading"}>
                Get Events
              </Button>
              <Button onClick={testCreateCalendarEvent} disabled={results.createEvent?.status === "loading"}>
                Create Event
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              {renderResult(results.calendarEvents)}
              {results.createEvent && renderResult(results.createEvent)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Prerequisites:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Be logged in with Google OAuth (Better Auth session cookie required)</li>
            <li>Backend server running on http://localhost:8000</li>
            <li>Database connection working</li>
            <li>Google Calendar permissions granted during OAuth</li>
          </ul>

          <p className="mt-4"><strong>Troubleshooting:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>"Not authenticated" → Check if you're logged in and session cookie exists</li>
            <li>"No Google account linked" → Re-authenticate with Google Calendar permissions</li>
            <li>Connection errors → Ensure backend is running and CORS is configured</li>
            <li>Database errors → Check your .env file and database connection</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}