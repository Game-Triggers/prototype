// G-Key Cooloff Period Options for Campaign Creation
// These options will be displayed to brands when creating campaigns

export interface CooloffOption {
  value: number; // Hours
  label: string;
  description: string;
  recommended?: boolean;
}

export const GKEY_COOLOFF_OPTIONS: CooloffOption[] = [
  {
    value: 24,
    label: '1 Day',
    description: 'Quick turnaround for short-term promotions',
  },
  {
    value: 72,
    label: '3 Days',
    description: 'Short break for flash sales or limited offers',
  },
  {
    value: 168,
    label: '1 Week',
    description: 'Standard break for weekly promotions',
  },
  {
    value: 336,
    label: '2 Weeks',
    description: 'Moderate cooloff for medium campaigns',
  },
  {
    value: 720,
    label: '30 Days',
    description: 'Standard cooloff period for most campaigns',
    recommended: true,
  },
  {
    value: 1440,
    label: '60 Days',
    description: 'Extended break for major brand campaigns',
  },
  {
    value: 2160,
    label: '90 Days',
    description: 'Long cooloff for exclusive high-value campaigns',
  },
  {
    value: 4320,
    label: '6 Months',
    description: 'Extended exclusivity for premium partnerships',
  },
  {
    value: 8760,
    label: '1 Year',
    description: 'Maximum cooloff for annual exclusive deals',
  },
];

export const DEFAULT_COOLOFF_HOURS = 720; // 30 days

export function getCooloffOptionLabel(hours: number): string {
  const option = GKEY_COOLOFF_OPTIONS.find(opt => opt.value === hours);
  return option ? option.label : `${hours} hours`;
}

export function getCooloffOptionDescription(hours: number): string {
  const option = GKEY_COOLOFF_OPTIONS.find(opt => opt.value === hours);
  return option ? option.description : 'Custom cooloff period';
}

export function formatCooloffDuration(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours < 168) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours < 720) {
    const weeks = Math.floor(hours / 168);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  } else if (hours < 8760) {
    const months = Math.floor(hours / 720);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(hours / 8760);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
}
