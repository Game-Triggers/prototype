"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LucideIcon,
  Gamepad2,
  Music,
  Heart,
  Coffee,
  ShoppingBag,
  Laptop
} from "lucide-react";
import { formatCurrency } from "@/lib/currency-config";

// Define a type for our campaign data
export interface Campaign {
  id: string;
  title: string;
  description: string;
  brandName: string;
  brandLogo?: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  budget: number;
  remainingBudget: number;
  paymentRate: number;
  paymentType: 'cpm' | 'fixed';
  categories: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  activeStreamers?: number;
  participationStatus?: string;
}

// Category icon mapping
export const categoryIcons: Record<string, LucideIcon> = {
  gaming: Gamepad2,
  music: Music,
  lifestyle: Heart,
  food: Coffee,
  shopping: ShoppingBag,
  tech: Laptop,
};

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const CategoryIcon = campaign.categories[0] && categoryIcons[campaign.categories[0].toLowerCase()] 
    ? categoryIcons[campaign.categories[0].toLowerCase()] 
    : ShoppingBag;

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Campaign Media */}
      <div className="relative h-48 w-full bg-muted">
        {campaign.mediaUrl && (
          <>
            {/* Image media type */}
            {(campaign.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || campaign.mediaType === 'image') && (
              <Image 
                src={campaign.mediaUrl} 
                alt={campaign.title} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
            
            {/* Video media type */}
            {(campaign.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || campaign.mediaType === 'video') && (
              <video
                src={campaign.mediaUrl}
                controls={false}
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
          </>
        )}
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${campaign.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : campaign.status === 'paused' 
                ? 'bg-yellow-100 text-yellow-800' 
                : campaign.status === 'draft' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
              }`}
          >
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
        </div>
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <CategoryIcon className="h-3 w-3 mr-1" />
            {campaign.categories[0]}
          </span>
        </div>
      </div>
      {/* Campaign Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {campaign.brandLogo ? (
              <Image src={campaign.brandLogo} alt={campaign.brandName} width={24} height={24} />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-xs text-primary-foreground">
                {campaign.brandName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-sm font-medium">{campaign.brandName}</span>
        </div>
        
        <h3 className="text-lg font-semibold mb-1">{campaign.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-grow">{campaign.description}</p>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {campaign.paymentType === 'cpm' 
                ? `${formatCurrency(campaign.paymentRate)} CPM` 
                : `${formatCurrency(campaign.paymentRate)} per stream`}
            </span>
            <span className="text-xs text-muted-foreground">
              Budget: {formatCurrency(campaign.remainingBudget)} / {formatCurrency(campaign.budget)}
            </span>
          </div>
          <Button 
            className="w-full" 
            variant="outline"
            asChild
          >
            <Link href={`/dashboard/campaigns/${campaign.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
