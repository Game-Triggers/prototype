# File Upload API Guide for Instreamly Clone

This document provides a comprehensive guide on how the file upload API works in the Instreamly Clone platform and how to make authorized API requests to it.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication Requirements](#authentication-requirements)
3. [API Endpoints](#api-endpoints)
4. [Making Authorized Upload Requests](#making-authorized-upload-requests)
5. [File Limitations and Validation](#file-limitations-and-validation)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)
8. [Example Implementation](#example-implementation)
9. [Debugging Tips](#debugging-tips)

## API Overview

The Instreamly Clone platform includes a file upload system that allows users to upload media files (images and videos) for campaigns. The API is built with NestJS and follows REST principles. The upload system is secured with JWT-based authentication to ensure only authorized users can upload files.

## Authentication Requirements

All upload requests (except for the test endpoint) require authentication using JWT tokens. The authentication flow works as follows:

1. User logs in via NextAuth (using Twitch, Google, or Credentials provider)
2. NextAuth generates a session with JWT tokens
3. API requests include the JWT token in the Authorization header
4. The NestJS backend validates the token before processing the upload

## API Endpoints

### Main Upload Endpoint

- **URL**: `/api/v1/upload`
- **Method**: POST
- **Authentication**: Required (JWT)
- **Content-Type**: multipart/form-data
- **Purpose**: Upload media files (images/videos) for campaigns

### Test Status Endpoint

- **URL**: `/api/v1/upload/test-status`
- **Method**: GET
- **Authentication**: Not required
- **Purpose**: Check if the upload service is running correctly

## Making Authorized Upload Requests

To make an authorized upload request, you need to:

1. Include a valid JWT token in the Authorization header
2. Use multipart/form-data format
3. Include the file in the 'file' field of the form data

Here's an example of how to construct the request:

```typescript
// Create a FormData object to upload the file
const uploadFormData = new FormData();
uploadFormData.append('file', fileObject); // fileObject is a File or Blob

// Upload media to storage service
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const uploadResponse = await fetch(`${API_URL}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.accessToken}`, // JWT token from NextAuth session
  },
  body: uploadFormData,
});

// Process the response
if (uploadResponse.ok) {
  const uploadResult = await uploadResponse.json();
  const mediaUrl = uploadResult.url;
  // Use mediaUrl in your application
} else {
  throw new Error('Failed to upload media file');
}
```

## File Limitations and Validation

The upload API validates files based on:

1. **File Type**: Only accepts specific image and video formats
   - Allowed image types: JPEG, PNG, GIF, WebP
   - Allowed video types: MP4, WebM, QuickTime (MOV)

2. **File Size**: Default maximum size is 10MB
   - This can be configured via the `MAX_FILE_SIZE` environment variable

## Response Format

### Successful Response (200 OK)

```json
{
  "status": 201,
  "message": "File uploaded successfully",
  "url": "/uploads/images/ab1cd234-5ef6-789g-hijk-lmnopqrst012.jpg",
  "fileName": "ab1cd234-5ef6-789g-hijk-lmnopqrst012.jpg",
  "fileType": "image/jpeg"
}
```

The `url` field contains the path to the uploaded file, which can be used to access the file from the frontend.

## Error Handling

The API returns appropriate error responses in case of issues:

### Authentication Error (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "You must be authenticated to upload files",
  "error": "Unauthorized"
}
```

### Bad Request Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "No file uploaded",
  "error": "Bad Request"
}
```

Or for invalid file types:

```json
{
  "statusCode": 400,
  "message": "Only images (jpeg, png, gif, webp) and videos (mp4, webm, mov) are allowed!",
  "error": "Bad Request"
}
```

## Example Implementation

Here's a complete example of how to implement file uploads in a Next.js component:

```tsx
const uploadMedia = async (file: File): Promise<string> => {
  try {
    // Create a FormData object
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    // Get session for authentication token
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new Error('No authentication token available');
    }
    
    // Upload media to storage service
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: uploadFormData,
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.message || 'Failed to upload media file');
    }
    
    const uploadResult = await uploadResponse.json();
    return uploadResult.url;
  } catch (error) {
    console.error("Media upload error:", error);
    throw error;
  }
};
```

## Debugging Tips

If you encounter issues with file uploads, you can use the auth debug endpoints to verify the authentication is working correctly:

### Check Authentication Status

```typescript
const checkAuthStatus = async () => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    const session = await getSession();
    
    const response = await fetch(`${API_URL}/auth-debug/status`, {
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    });
    
    const data = await response.json();
    console.log("Auth status:", data);
  } catch (error) {
    console.error("Error checking auth status:", error);
  }
};
```

### Common Issues and Solutions

1. **401 Unauthorized errors**
   - Check that your session contains a valid accessToken
   - Verify that the token hasn't expired (default session duration is 24 hours)

2. **File type validation failures**
   - Ensure you're uploading one of the supported file types
   - Check the mimetype of the file you're trying to upload

3. **File size issues**
   - Verify that your file is under the size limit (default 10MB)
   - Consider compressing images or videos before upload

4. **Missing file errors**
   - Make sure you're appending the file to the FormData with the key 'file'
   - Check that the file object is valid and not null/undefined
