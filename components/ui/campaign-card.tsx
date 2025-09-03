import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CampaignStatus } from "@/schemas/campaign.schema";
import { ParticipationStatus } from "@/schemas/campaign-participation.schema";
import { CheckCircle, Clock, Image as ImageIcon, Play, Users, Lock, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    description: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    paymentType: "cpm" | "fixed";
    paymentRate: number;
    budget: number;
    remainingBudget: number;
    startDate: string;
    endDate: string;
    status: string;
    targetAudience?: {
      minViewers?: number;
      maxViewers?: number;
      categories?: string[];
      languages?: string[];
    };
    participationStatus?: string;  // For streamer view
    impressions?: number;         // For analytics
    clicks?: number;              // For analytics
    earnings?: number;            // For streamer view
  };
  variant?: "streamer" | "brand" | "admin";
  onActionClick?: (action: string, campaignId: string) => void;
}

export function CampaignCard({ campaign, variant = "streamer", onActionClick }: CampaignCardProps) {
  const isStreamerView = variant === "streamer";
  const isBrandView = variant === "brand";
  const isAdminView = variant === "admin";
  
  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return "bg-green-500";
      case CampaignStatus.PAUSED:
        return "bg-yellow-500";
      case CampaignStatus.COMPLETED:
        return "bg-blue-500";
      case CampaignStatus.DRAFT:
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get participation status color
  const getParticipationStatusColor = (status?: string) => {
    if (!status) return "";
    
    switch (status) {
      case ParticipationStatus.ACTIVE:
        return "bg-green-500";
      case ParticipationStatus.PAUSED:
        return "bg-yellow-500";
      case ParticipationStatus.REJECTED:
        return "bg-red-500";
      case ParticipationStatus.COMPLETED:
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Get payment information display
  const getPaymentDisplay = () => {
    if (campaign.paymentType === "cpm") {
      return `$${campaign.paymentRate.toFixed(2)} per 1,000 impressions`;
    } else {
      return `$${campaign.paymentRate.toFixed(2)} fixed rate`;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative bg-muted">
        {campaign.mediaType === "image" ? (
          campaign.mediaUrl ? (
            <Image
              src={campaign.mediaUrl}
              alt={campaign.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full bg-black">
            {campaign.mediaUrl ? (
              <video
                src={campaign.mediaUrl}
                className="h-full w-full object-contain"
                controls
                poster="/images/video-placeholder.png"
              />
            ) : (
              <Play className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <Badge className={`${getStatusColor(campaign.status)} text-white`}>
            {campaign.status}
          </Badge>
          
          {/* Participation status for streamers */}
          {isStreamerView && campaign.participationStatus && (
            <Badge className={`ml-2 ${getParticipationStatusColor(campaign.participationStatus)} text-white`}>
              {campaign.participationStatus}
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
        <CardDescription className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground mb-4">
          {campaign.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium">{getPaymentDisplay()}</span>
          </div>
          
          {isBrandView && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium">
                ${campaign.remainingBudget.toFixed(2)} / ${campaign.budget.toFixed(2)}
              </span>
            </div>
          )}
          
          {isStreamerView && campaign.earnings !== undefined && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Earned</span>
              <span className="font-medium">${campaign.earnings.toFixed(2)}</span>
            </div>
          )}
          
          {campaign.targetAudience && (
            <>
              {campaign.targetAudience.categories && campaign.targetAudience.categories.length > 0 && (
                <div className="flex flex-col col-span-2">
                  <span className="text-muted-foreground">Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.targetAudience.categories.slice(0, 3).map((category, i) => (
                      <Badge key={i} variant="outline">{category}</Badge>
                    ))}
                    {campaign.targetAudience.categories.length > 3 && (
                      <Badge variant="outline">+{campaign.targetAudience.categories.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {(campaign.impressions !== undefined || campaign.clicks !== undefined) && (
            <div className="flex flex-col col-span-2 mt-2">
              <span className="text-muted-foreground mb-1">Performance</span>
              <div className="flex items-center space-x-4">
                {campaign.impressions !== undefined && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{campaign.impressions.toLocaleString()} impressions</span>
                  </div>
                )}
                {campaign.clicks !== undefined && (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>{campaign.clicks.toLocaleString()} clicks</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={`/dashboard/campaigns/${campaign.id}`}>
            View Details
          </Link>
        </Button>
        
        {isStreamerView && !campaign.participationStatus && (
          <Button
            size="sm"
            onClick={() => onActionClick && onActionClick('join', campaign.id)}
          >
            Join Campaign
          </Button>
        )}
          {isStreamerView && campaign.participationStatus === ParticipationStatus.ACTIVE && (
          <Button
            size="sm"
            variant="secondary"
            asChild
          >
            <Link href="/dashboard/campaigns/my-campaigns/overlay-help">
              Overlay Setup
            </Link>
          </Button>
        )}
        
        {isBrandView && campaign.status === CampaignStatus.ACTIVE && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onActionClick && onActionClick('pause', campaign.id)}
          >
            Pause Campaign
          </Button>
        )}
        
        {isBrandView && campaign.status === CampaignStatus.PAUSED && (
          <Button
            size="sm"
            onClick={() => onActionClick && onActionClick('resume', campaign.id)}
          >
            Resume Campaign
          </Button>
        )}
        
        {isAdminView && (
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onActionClick && onActionClick('review', campaign.id)}
            >
              Review
            </Button>
            {campaign.status === CampaignStatus.PAUSED && (
              <Button
                size="sm"
                onClick={() => onActionClick && onActionClick('approve', campaign.id)}
              >
                Approve
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}