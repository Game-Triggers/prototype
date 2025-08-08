import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for fetching user profile from the NestJS backend
 * Handles GET /api/user/profile
 */
export async function GET() {
    try {
        // Get the session to ensure the user is authenticated
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // Forward request to the backend with authorization header
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store' // Don't cache this response
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Profile request failed with status ${response.status}:`, errorText);
            return NextResponse.json(
                { error: 'Failed to fetch user profile', message: errorText },
                { status: response.status }
            );
        }
        
        // Get the response data
        const profileData = await response.json();
        
        // Return the response with role info for page logic
        return NextResponse.json({
            ...profileData,
            role: session.user.role || 'unknown'
        });
    } catch (error) {
        console.error('Error proxying GET /users/me:', error);
        return NextResponse.json(
            { error: 'Error processing profile request', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * Proxy handler for updating user profile to the NestJS backend
 * Handles PUT /api/user/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse incoming update and only forward allowed fields (typed)
    const body = await request.json();
    type UpdatePayload = {
      name?: string;
      channelUrl?: string;
      category?: string[];
      language?: string[];
      description?: string;
    };
    const updatePayload: UpdatePayload = {};
    if (typeof body?.name === "string") updatePayload.name = body.name;
    if (typeof body?.channelUrl === "string") updatePayload.channelUrl = body.channelUrl;
    if (Array.isArray(body?.category)) updatePayload.category = body.category as string[];
    if (Array.isArray(body?.language)) updatePayload.language = body.language as string[];
    if (typeof body?.description === "string") updatePayload.description = body.description;

    // Determine user id from session, fallback to /users/me
    const sessUser = session.user as Partial<{ id: string; _id: string; role: string }>;
    let userId = sessUser.id || sessUser._id;
    if (!userId) {
      const meResp = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!meResp.ok) {
        const t = await meResp.text();
        return NextResponse.json(
          { error: "Failed to resolve current user id", message: t },
          { status: meResp.status }
        );
      }
      const me = await meResp.json();
      userId = me?._id || me?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User id not found in session or backend" },
        { status: 400 }
      );
    }

    // Forward update to backend
    const putResp = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!putResp.ok) {
      const errorText = await putResp.text();
      return NextResponse.json(
        { error: "Failed to update profile", message: errorText },
        { status: putResp.status }
      );
    }

    // Return fresh profile from backend for consistency
    const refreshed = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });

    if (!refreshed.ok) {
      const updatedFallback = await putResp.json().catch(() => ({}));
      return NextResponse.json({ ...updatedFallback, role: sessUser.role || "unknown" });
    }

    const profileData = await refreshed.json();
    return NextResponse.json({ ...profileData, role: sessUser.role || "unknown" });
  } catch (error) {
    console.error("Error proxying PUT /users/:id:", error);
    return NextResponse.json(
      { error: "Error processing profile update", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
