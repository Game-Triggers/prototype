"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, RefreshCcw } from "lucide-react";

export default function SimpleUploadTest() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDirectUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setResult(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      
      // Direct fetch to backend API using token from session
      const response = await fetch("http://localhost:3001/api/v1/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });
      
      const data = await response.text();
      setResult(`Status: ${response.status} - ${data}`);
    } catch (error) {
      console.error("Error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProxiedUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setResult(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      
      // Use Next.js API route to proxy the request
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.text();
      setResult(`Status: ${response.status} - ${data}`);
    } catch (error) {
      console.error("Error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Upload Test</h1>
      
      <Card className="p-4 mb-4">
        <div>
          <p className="mb-2">Current auth status:</p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {session ? JSON.stringify(session, null, 2) : "Not authenticated"}
          </pre>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        
        <div className="flex space-x-2 mb-4">
          <Button
            onClick={handleDirectUpload}
            disabled={!file || isUploading || !session}
            className="flex items-center"
          >
            {isUploading ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Direct to Backend
          </Button>
          
          <Button
            onClick={handleProxiedUpload}
            disabled={!file || isUploading}
            className="flex items-center"
            variant="outline"
          >
            {isUploading ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Via Next.js API
          </Button>
        </div>
        
        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Result:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {result}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
