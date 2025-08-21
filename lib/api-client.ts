/**
 * Base API URL from environment variables
 * In production, we use the Next.js API routes as a proxy to the NestJS backend
 * In development, based on how we're running the app with dev:unified script
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || // Custom URL if provided
  (typeof window === "undefined"
    ? "http://localhost:3001/api/v1" // Server-side - direct to NestJS backend
    : "/api"); // Client-side - use Next.js API route proxy

// Debug info in development
if (process.env.NODE_ENV === "development") {
  console.log(`API client initialized with base URL: ${API_URL}`);
}

/**
 * Base fetch function with error handling
 * Simplified to use NextAuth session without token refresh logic
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Extract and properly format the authorization header if present
  const auth =
    options.headers && "Authorization" in options.headers
      ? (options.headers["Authorization"] as string)
      : null;

  if (auth) {
    headers["Authorization"] = auth.startsWith("Bearer ")
      ? auth
      : `Bearer ${auth}`;
  }

  // For client-side requests, ensure we have the session token
  if (typeof window !== "undefined" && !auth) {
    try {
      // Let the fetch proceed without a token - the server-side API route
      // will handle authentication via the session cookie
      console.log(
        "Client-side API request without explicit token, using session cookie"
      );
    } catch (error) {
      console.warn("Unable to get session token for API request:", error);
    }
  }

  // Debug log for authentication header in development
  if (process.env.NODE_ENV === "development" && headers["Authorization"]) {
    console.log(
      "Auth header present:",
      headers["Authorization"] ? "Yes" : "No"
    );
  }

  const url = `${API_URL}${endpoint}`;

  // Additional debug for development
  if (process.env.NODE_ENV === "development") {
    console.log(`Making API request to: ${url}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Debug log for API responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `API ${options.method || "GET"} ${endpoint} response:`,
        res.status
      );
    } // Handle authentication errors by redirecting to sign-in
    if (res.status === 401 && typeof window !== "undefined") {
      console.log("Authentication failed, redirecting to sign-in");
      // Dispatch event for session expiration
      window.dispatchEvent(new Event("auth-error"));
      throw new Error("Authentication failed. Please sign in again.");
    }

    // For other errors
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "Unknown error" }));
      console.error(
        `API Error [${res.status}]:`,
        errorData.message || "Unknown error"
      );
      throw new Error(errorData.message || `API error: ${res.status}`);
    }

    // For successful responses
    return (await res.json()) as T;
  } catch (error) {
    console.error(`API request failed:`, error);
    throw error;
  }
}

/**
 * Generic API Client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: async <T = any>(endpoint: string, token?: string): Promise<T> => {
    return fetchApi<T>(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * POST request
   */
  post: async <T = any>(
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * PUT request
   */
  put: async <T = any>(
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(endpoint: string, token?: string): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Check if the current streamer's stream is live
   */
  checkStreamStatus: async () => {
    try {
      return await fetch("/api/stream-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to check stream status");
        return res.json();
      });
    } catch (error) {
      console.error("Error checking stream status:", error);
      return {
        success: false,
        isLive: false,
        viewerCount: 0,
        platform: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Authentication API client
 */
export const authApi = {
  /**
   * Register a new user (brand)
   */
  register: async (userData: {
    name: string;
    companyName: string;
    email: string;
    password: string;
    role: string;
  }) => {
    return fetchApi<{ user: any; accessToken: string; refreshToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      }
    );
  },

  /**
   * Login with email and password (for brands)
   */
  login: async (credentials: { email: string; password: string }) => {
    return fetchApi<{ user: any; accessToken: string; refreshToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );
  },

  /**
   * Exchange OAuth tokens (for streamers)
   */
  exchangeOAuthToken: async (
    provider: string,
    data: {
      accessToken: string;
      refreshToken?: string;
      profile: any;
    }
  ) => {
    return fetchApi<{ user: any; accessToken: string; refreshToken: string }>(
      `/auth/${provider}/callback`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};

/**
 * Campaigns API client
 */
export const campaignsApi = {
  /**
   * Get all campaigns (with optional filters)
   */
  getAll: async (
    params?: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
    },
    token?: string
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    return fetchApi(`/campaigns${queryString}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Get a single campaign by ID
   */
  getById: async (id: string, token?: string) => {
    return fetchApi(`/campaigns/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Create a new campaign
   */
  create: async (campaignData: any, token: string) => {
    return fetchApi("/campaigns", {
      method: "POST",
      body: JSON.stringify(campaignData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update an existing campaign
   */
  update: async (id: string, campaignData: any, token: string) => {
    return fetchApi(`/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(campaignData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Join a campaign (for streamers)
   */
  join: async (campaignId: string, token: string) => {
    return fetchApi(`/campaigns/${campaignId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Leave a campaign (for streamers)
   */
  leave: async (campaignId: string, token: string) => {
    return fetchApi(`/campaigns/${campaignId}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Upload campaign media (image/video)
   */
  uploadMedia: async (formData: FormData, token: string) => {
    return fetchApi("/campaigns/media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },
};

/**
 * Analytics API client
 */
export const analyticsApi = {
  /**
   * Get analytics data for the current user
   */
  getUserAnalytics: async (
    params: {
      dateRange?: string;
      startDate?: string;
      endDate?: string;
    },
    token: string
  ) => {
    const queryParams = new URLSearchParams();
    if (params.dateRange) queryParams.append("dateRange", params.dateRange);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    return fetchApi(`/analytics${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get analytics for a specific campaign
   */
  getCampaignAnalytics: async (
    campaignId: string,
    params: {
      dateRange?: string;
      startDate?: string;
      endDate?: string;
    },
    token: string
  ) => {
    const queryParams = new URLSearchParams();
    if (params.dateRange) queryParams.append("dateRange", params.dateRange);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    return fetchApi(`/analytics/campaigns/${campaignId}${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get streamer analytics
   */
  getStreamerAnalytics: async (token: string) => {
    return fetchApi("/analytics/streamer", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get brand analytics
   */
  getBrandAnalytics: async (token: string) => {
    return fetchApi("/analytics/brand", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get dashboard analytics for the current user
   */
  getDashboardData: async (token: string) => {
    return fetchApi("/analytics/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

/**
 * Users API client
 */
export const usersApi = {
  /**
   * Get the current user's profile
   */
  getProfile: async (token: string, refreshToken?: string) => {
    return fetchApi("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (
    profileData: any,
    token: string,
    refreshToken?: string
  ) => {
    return fetchApi("/users/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get overlay settings for a streamer
   */
  getOverlaySettings: async (token: string, refreshToken?: string) => {
    return fetchApi("/users/me/overlay", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update overlay settings for a streamer
   */
  updateOverlaySettings: async (
    settingsData: any,
    token: string,
    refreshToken?: string
  ) => {
    return fetchApi("/users/me/overlay", {
      method: "PUT",
      body: JSON.stringify(settingsData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Regenerate the overlay token for a streamer
   */
  regenerateOverlayToken: async (token: string, refreshToken?: string) => {
    return fetchApi("/users/me/overlay/regenerate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Check the status of a streamer's overlay (active/inactive)
   */
  checkOverlayStatus: async (overlayToken: string, token: string) => {
    return fetchApi(`/users/me/overlay/status?overlayToken=${overlayToken}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Trigger a test ad to be displayed in the overlay
   */
  triggerTestAd: async (
    overlayToken: string,
    token: string,
    refreshToken?: string,
    testCampaign?: any
  ) => {
    return fetchApi(`/users/me/overlay/test`, {
      method: "POST",
      body: JSON.stringify({ overlayToken, testCampaign }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get user profile including campaign selection settings
   */
  getUserProfile: async (token: string, refreshToken?: string) => {
    return fetchApi("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update campaign selection settings for a streamer
   */
  updateCampaignSelectionSettings: async (
    settingsData: any,
    token: string,
    refreshToken?: string
  ) => {
    return fetchApi("/users/me/campaign-selection", {
      method: "PUT",
      body: JSON.stringify(settingsData),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    token?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.role) queryParams.append("role", params.role);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    return fetchApi(`/users${queryString}`, {
      headers: params?.token ? { Authorization: `Bearer ${params.token}` } : {},
    });
  },

  /**
   * Get the current user's level data
   */
  getLevel: async (token?: string) => {
    return fetchApi("/users/me/level", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Check for level up and update if necessary
   */
  checkLevelUp: async (token?: string) => {
    return fetchApi("/users/me/level/check", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};
