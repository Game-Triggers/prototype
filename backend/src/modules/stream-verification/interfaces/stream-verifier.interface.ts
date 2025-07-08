/**
 * Interface defining methods for verifying stream status and retrieving viewer counts
 * across different streaming platforms.
 */
export interface StreamVerifier {
  /**
   * Checks if a stream is currently live.
   * @param platformUserId The user ID on the specific platform
   * @param accessToken Authentication token for the platform API
   * @returns Promise resolving to true if stream is live, false otherwise
   */
  isStreamLive(platformUserId: string, accessToken: string): Promise<boolean>;

  /**
   * Gets the current viewer count for a live stream.
   * @param platformUserId The user ID on the specific platform
   * @param accessToken Authentication token for the platform API
   * @returns Promise resolving to the number of concurrent viewers, or 0 if stream is not live
   */
  getViewerCount(platformUserId: string, accessToken: string): Promise<number>;

  /**
   * Gets the stream duration in minutes.
   * @param platformUserId The user ID on the specific platform
   * @param accessToken Authentication token for the platform API
   * @returns Promise resolving to the stream duration in minutes, or 0 if stream is not live
   */
  getStreamDuration(
    platformUserId: string,
    accessToken: string,
  ): Promise<number>;

  /**
   * Refreshes the access token if needed.
   * @param refreshToken The refresh token to use
   * @returns Promise resolving to the new access token
   */
  refreshAccessToken(refreshToken: string): Promise<string>;
}
