"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { AuthCheck } from "@/components/ui/auth-check";

export default function UploadTestContent() {
  const { data: session, status } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
    fileType?: string;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [directToken, setDirectToken] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setDebugInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({
        success: false,
        message: "Please select a file first",
      });
      return;
    }

    setIsUploading(true);
    setDebugInfo(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Get token (try both sources)
      const token = directToken || session?.accessToken;
      
      // Check auth status
      setDebugInfo((prev: any) => ({
        ...prev,
        authStatus: {
          isAuthenticated: status === "authenticated",
          role: session?.user?.role,
          hasToken: !!token,
          tokenSource: directToken ? 'direct' : 'session',
          tokenPrefix: token?.substring(0, 10) + '...',
        }
      }));

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      
      // Make the API request
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      // Parse response
      const responseData = await response.json();
      
      // Store debug info
      setDebugInfo(prev => ({
        ...prev,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody: responseData
      }));

      if (response.ok) {
        setUploadResult({
          success: true,
          message: "File uploaded successfully!",
          url: responseData.url,
          fileType: responseData.fileType,
        });
      } else {
        setUploadResult({
          success: false,
          message: responseData.message || "Failed to upload file",
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error.message || "An error occurred during upload",
      });
      
      setDebugInfo(prev => ({
        ...prev,
        error: error.message || "Unknown error"
      }));
    }
    
    setIsUploading(false);
  };

  const testAuthStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const response = await fetch(`${API_URL}/upload/test-status`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`,
        }
      });
      
      const data = await response.json();
      
      setDebugInfo(prev => ({
        ...prev,
        serviceTest: {
          status: response.status,
          data
        }
      }));
    } catch (error: any) {
      setDebugInfo(prev => ({
        ...prev,
        serviceTest: {
          error: error.message
        }
      }));
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Test Page</h1>
      
      {/* Authentication status component */}
      <AuthCheck onTokenReceived={(token) => setDirectToken(token)} />
      
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
            {selectedFile && (
              <p className="mt-2 text-sm">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || (!session?.accessToken && !directToken)}
              className="flex items-center space-x-2"
            >
              {isUploading ? (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testAuthStatus}
              disabled={!session?.accessToken && !directToken}
            >
              Test Upload Service
            </Button>
          </div>

          {status !== "authenticated" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              <p>⚠️ You must be signed in to upload files.</p>
            </div>
          )}
          
          {uploadResult && (
            <div className={`p-4 ${uploadResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-md`}>
              <div className="flex items-center">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <p>{uploadResult.message}</p>
              </div>

              {uploadResult.success && uploadResult.url && (
                <div className="mt-4">
                  <p className="font-medium">File URL:</p>
                  <p className="text-xs break-all">{uploadResult.url}</p>
                  
                  {uploadResult.fileType?.startsWith('image/') ? (
                    <div className="mt-2">
                      <p className="font-medium">Preview:</p>
                      <img 
                        src={uploadResult.url} 
                        alt="Uploaded image" 
                        className="mt-2 max-w-full h-auto max-h-48 rounded border border-gray-200"
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="font-medium">File type:</p>
                      <p>{uploadResult.fileType}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Debug Information */}
      {debugInfo && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-4">
            {debugInfo.authStatus && (
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugInfo.authStatus, null, 2)}
                </pre>
              </div>
            )}
            
            {debugInfo.serviceTest && (
              <div>
                <h3 className="text-lg font-medium mb-2">Service Test</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugInfo.serviceTest, null, 2)}
                </pre>
              </div>
            )}
            
            {debugInfo.responseStatus && (
              <div>
                <h3 className="text-lg font-medium mb-2">Response Status: {debugInfo.responseStatus}</h3>
              </div>
            )}
            
            {debugInfo.responseBody && (
              <div>
                <h3 className="text-lg font-medium mb-2">Response Data</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugInfo.responseBody, null, 2)}
                </pre>
              </div>
            )}
            
            {debugInfo.error && (
              <div>
                <h3 className="text-lg font-medium mb-2">Error</h3>
                <p className="text-red-600">{debugInfo.error}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
