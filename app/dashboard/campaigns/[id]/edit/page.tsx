"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CampaignForm } from "@/components/ui/campaign-form";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { CampaignStatus, MediaType } from "@/schemas/campaign.schema";
import { UserRole } from "@/schemas/user.schema";

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if not a brand user or admin
  useEffect(() => {
    if (status === "authenticated" && 
        session?.user?.role !== UserRole.BRAND && 
        session?.user?.role !== UserRole.ADMIN) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch campaign data when component mounts
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/campaigns/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }
        
        const campaignData = await response.json();
        console.log('Fetched campaign data:', campaignData);
        
        // Format dates for form (yyyy-MM-dd format)
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        // Set the campaign data for the form
        setCampaign({
          title: campaignData.title || '',
          description: campaignData.description || '',
          budget: campaignData.budget || 0,
          remainingBudget: campaignData.remainingBudget || 0,
          mediaUrl: campaignData.mediaUrl || '',
          mediaType: campaignData.mediaType || MediaType.IMAGE,
          paymentRate: campaignData.paymentRate || 0,
          paymentType: campaignData.paymentType || 'cpm',
          categories: campaignData.categories && campaignData.categories.length > 0 ? campaignData.categories[0] : "",
          languages: campaignData.languages || [],
          startDate: formatDateForInput(campaignData.startDate),
          endDate: formatDateForInput(campaignData.endDate),
          status: campaignData.status || CampaignStatus.DRAFT,
          brandId: campaignData.brandId || '',
        });
        
        // Check if user has permission to edit this campaign
        if (session?.user?.role === UserRole.BRAND && 
            session?.user?.id !== campaignData.brandId) {
          setError("You don't have permission to edit this campaign");
          router.push(`/dashboard/campaigns/${id}`);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setError('Failed to load campaign details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id && status === 'authenticated') {
      fetchCampaign();
    }
  }, [id, status, session, router]);

  const handleSubmit = async (formData) => {
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
      }
      
      // Prepare campaign update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        // Only update mediaUrl if a new file was uploaded
        ...(formData.mediaFile && { mediaUrl, mediaType: formData.mediaType }),
        // Don't allow direct modification of budget if campaign is active
        ...(campaign.status === CampaignStatus.DRAFT && { 
          budget: typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget 
        }),
        categories: formData.categories || [],  // formData.categories is already an array
        languages: formData.languages || [],
        paymentType: formData.paymentType,
        // Only allow payment rate changes in draft mode
        ...(campaign.status === CampaignStatus.DRAFT && { 
          paymentRate: typeof formData.paymentRate === 'string' ? parseFloat(formData.paymentRate) : formData.paymentRate 
        }),
        ...(formData.startDate && { startDate: new Date(formData.startDate) }),
        ...(formData.endDate && { endDate: new Date(formData.endDate) }),
      };
      
      // Update campaign via API
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update campaign`);
      }
      
      const updatedCampaign = await response.json();
      console.log('Campaign updated successfully:', updatedCampaign);
      
      setIsSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${id}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to update campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Campaign Updated!</h1>
          <p className="mt-2 text-muted-foreground">
            Your campaign has been updated successfully.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href={`/dashboard/campaigns/${id}`}>
                View Campaign
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
            <Link href={`/dashboard/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Update your campaign details
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
      {campaign && (
        <Card className="p-6">
          <CampaignForm
            initialData={campaign}
            isEditing={true}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </Card>
      )}
    </div>
  );
}
