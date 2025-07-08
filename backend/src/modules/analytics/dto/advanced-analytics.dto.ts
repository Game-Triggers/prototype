import { IsOptional, IsString, IsNumber } from 'class-validator';

export class AdvancedAnalyticsResponseDto {
  // Traditional metrics
  impressions: number;
  clicks: number;

  // Viewer-based metrics
  viewerImpressions: number;
  uniqueViewers: number;

  // Alternative engagement metrics
  chatClicks: number;
  qrScans: number;
  linkClicks: number;

  // Stream data
  totalStreamMinutes: number;
  avgViewerCount: number;
  peakViewerCount: number;

  // Calculated metrics
  viewerEngagementRate: number; // clicks / viewerImpressions
  traditionalEngagementRate: number; // clicks / impressions
  earningsPerStream: number;
  earningsPerMinute: number;
  earningsPerViewer: number;

  // Totals
  totalClicks: number; // Sum of all click types
  totalCampaigns: number;
  totalStreams: number;
  totalStreamers: number;
  estimatedEarnings: number;
}

export class AdvancedAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  streamerId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
