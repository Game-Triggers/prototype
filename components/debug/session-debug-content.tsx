"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RPTestActions } from "./rp-test-actions";

export default function SessionDebugContent() {
  const { data: session, status, update } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshSession = async () => {
    await update();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Debug</h1>
        <p className="text-muted-foreground mt-1">
          View your current session details
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="font-semibold">Status:</span>{" "}
              <code
                className={`px-2 py-1 rounded ${
                  status === "authenticated"
                    ? "bg-green-100 text-green-800"
                    : status === "loading"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {status}
              </code>
            </div>
            {session?.user && (
              <>
                <div>
                  <span className="font-semibold">User ID:</span>{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">{session.user.id}</code>
                </div>
                <div>
                  <span className="font-semibold">Name:</span>{" "}
                  <span>{session.user.name}</span>
                </div>
                <div>
                  <span className="font-semibold">Email:</span>{" "}
                  <span>{session.user.email}</span>
                </div>
                <div>
                  <span className="font-semibold">Role:</span>{" "}
                  <code
                    className={`px-2 py-1 rounded ${
                      session.user.role === "streamer"
                        ? "bg-blue-100 text-blue-800"
                        : session.user.role === "brand"
                        ? "bg-purple-100 text-purple-800"
                        : session.user.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {session.user.role || "undefined"}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Authentication Provider:</span>{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {session.provider || "unknown"}
                  </code>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <Button onClick={refreshSession}>Refresh Session</Button>
            <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Hide Raw Data" : "Show Raw Data"}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Raw Session Data</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-80 text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* RP Test Actions */}
        {session?.user && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">RP System Testing</h2>
            <RPTestActions />
          </Card>
        )}
      </div>
    </div>
  );
}
