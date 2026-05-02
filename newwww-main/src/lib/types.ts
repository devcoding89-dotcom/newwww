
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  isValid?: boolean;
}

export interface ContactList {
  id: string;
  name: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SenderSettings {
  fromName: string;
  fromEmail: string;
  domain: string;
  isDomainVerified: boolean;
  isSenderVerified: boolean;
}

export interface ComplianceSettings {
  handleBounces: boolean;
  handleSpam: boolean;
  bounceRate: number;
  complaintRate: number;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "paused" | "completed" | "failed";

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  body: string;
  internalNotes?: string;
  contactListId: string | null;
  status: CampaignStatus;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  scheduledAt?: string;
  smartRateLimiting: boolean;
  pauseOnBounceThreshold: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  status: 'delivered' | 'failed' | 'opened' | 'clicked';
  error?: string;
  sentAt: string;
}

export interface ExtractionSnapshot {
  id: string;
  title: string;
  rawText: string;
  contacts: Omit<Contact, "id">[];
  createdAt: string;
}

export type SubscriptionTier = "free" | "elite";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}
