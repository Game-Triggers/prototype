"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CampaignForm } from "@/components/ui/campaign-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserRole } from "@/schemas/user.schema";
import { CampaignStatus, MediaType } from "@/schemas/campaign.schema";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { campaignsApi } from "@/lib/api-client";

// Backend API expects this format
interface CampaignBackendData {
  title: string;
  description: string;
  budget: number;
  mediaUrl: string | null;
  mediaFile?: File | null;
  mediaType: MediaType;
  categories?: string;
  languages?: string[];
  paymentType: "cpm" | "fixed";
  paymentRate: string | number;
  startDate?: string;
  endDate?: string;
  gKeyCooloffHours?: number; // Backend expects hours
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not a brand user
  if (status === "authenticated" && session?.user?.role !== UserRole.BRAND) {
    router.push("/dashboard");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const handleSubmit = async (formData: CampaignBackendData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Upload media file first if present
      let mediaUrl = formData.mediaUrl;
      
      if (formData.mediaFile) {
        try {
          // Create a FormData object to upload the file
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.mediaFile);
          
          // Upload media to storage service
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
          const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
            body: uploadFormData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload media file');
          }
          
          const uploadResult = await uploadResponse.json();
          mediaUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Media upload error:", uploadError);
          setError("Failed to upload media file. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }      // Prepare campaign data matching the backend DTO
      const campaignData = {
        title: formData.title,
        description: formData.description,
        brandId: session?.user?.id, // Add brandId from session
        budget: typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget,
        categories: formData.categories || [],  // formData.categories is already an array
        languages: formData.languages || [],
        paymentType: formData.paymentType,
        paymentRate: typeof formData.paymentRate === 'string' ? parseFloat(formData.paymentRate) : formData.paymentRate,
        status: CampaignStatus.DRAFT,
        mediaType: formData.mediaType,
        mediaUrl: mediaUrl,
        gKeyCooloffHours: formData.gKeyCooloffHours,
        // The backend requires Date objects for startDate and endDate
        ...(formData.startDate && { startDate: new Date(formData.startDate) }),
        ...(formData.endDate && { endDate: new Date(formData.endDate) }),
      };
      
      // Call the API to create the campaign
      await campaignsApi.create(campaignData, session?.accessToken as string);
      
      // Show success state
      setIsSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/campaigns");
      }, 2000);
        } catch (error) {
      console.error("Error creating campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to create campaign. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Campaign Created!</h1>
          <p className="mt-2 text-muted-foreground">
            Your campaign has been created successfully and is now pending review.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/dashboard/campaigns">
                View Your Campaigns
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-2"
          >
            <Link href="/dashboard/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new campaign to connect with streamers
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Campaign Form */}
      <Card className="p-6">
        <CampaignForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialData={{
            status: CampaignStatus.DRAFT,
            mediaType: MediaType.IMAGE,
            paymentType: "cpm",
          }}
        />
      </Card>
    </div>
  );
}