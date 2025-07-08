import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Proxy handler for fetching campaign selection settings from the NestJS backend
 * Handles GET /api/user/me/campaign-selection
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
        const response = await fetch(`${API_URL}/users/me/campaign-selection`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store' // Don't cache this response
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Campaign selection GET request failed with status ${response.status}:`, errorText);
            return NextResponse.json(
                { error: 'Failed to fetch campaign selection settings', message: errorText },
                { status: response.status }
            );
        }
        
        // Get the response data
        const settingsData = await response.json();
        
        // Return the response
        return NextResponse.json(settingsData);
    } catch (error) {
        console.error('Error proxying GET /users/me/campaign-selection:', error);
        return NextResponse.json(
            { error: 'Error processing campaign selection request', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * Proxy handler for updating campaign selection settings to the NestJS backend
 * Handles PUT /api/user/me/campaign-selection
 */
export async function PUT(request: NextRequest) {
    try {
        // Get the session to ensure the user is authenticated
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // Parse the request body
        const body = await request.json();
        
        // Forward request to the backend with authorization header
        const response = await fetch(`${API_URL}/users/me/campaign-selection`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store' // Don't cache this response
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Campaign selection PUT request failed with status ${response.status}:`, errorText);
            return NextResponse.json(
                { error: 'Failed to update campaign selection settings', message: errorText },
                { status: response.status }
            );
        }
        
        // Get the response data
        const updatedData = await response.json();
        
        // Return the response
        return NextResponse.json(updatedData);
    } catch (error) {
        console.error('Error proxying PUT /users/me/campaign-selection:', error);
        return NextResponse.json(
            { error: 'Error processing campaign selection update', message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}