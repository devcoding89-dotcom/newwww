"use server";

import { extractEmails } from "@/ai/flows/ai-email-extraction-flow";
import { draftCampaignContent } from "@/ai/flows/ai-campaign-content-drafting";
import type {
  AiEmailExtractionOutput,
  AiEmailExtractionInput,
} from "@/ai/flows/ai-email-extraction-flow";
import type {
  AICampaignContentDraftingInput,
  AICampaignContentDraftingOutput,
} from "@/ai/flows/ai-campaign-content-drafting";
import type { Campaign, Contact, SenderSettings } from "./types";

import dns from "dns/promises";

/**
 * PLATFORM-MANAGED INFRASTRUCTURE (Twilio SendGrid)
 * No manual SMTP configuration is required from users.
 */

// Domain Validation
const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
  "icloud.com", "aol.com", "protonmail.com", "zoho.com"
];

export async function isPublicDomain(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

// AI Actions
export async function extractEmailsAction(
  input: AiEmailExtractionInput
): Promise<AiEmailExtractionOutput> {
  return await extractEmails(input);
}

export async function draftCampaignContentAction(
  input: AICampaignContentDraftingInput
): Promise<AICampaignContentDraftingOutput> {
  return await draftCampaignContent(input);
}

// Validation Action
export async function validateEmailAction(
  email: string
): Promise<{ isValid: boolean; reason: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: "Invalid format" };
  }

  const domain = email.split("@")[1];
  try {
    const records = await dns.resolveMx(domain);
    if (records && records.length > 0) {
      return { isValid: true, reason: "" };
    }
    return { isValid: false, reason: "No MX records found for domain" };
  } catch (error) {
    return { isValid: false, reason: "Domain does not exist or has no mail server" };
  }
}

// Domain Verification Mock
export async function verifyDomainAction(domain: string): Promise<{ success: boolean; message: string }> {
  // In a real app, this would check SendGrid's API for DNS verification status
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (domain.includes(".")) {
    return { success: true, message: "Domain DNS records verified successfully!" };
  }
  return { success: false, message: "Could not find valid DNS records for this domain." };
}

// Email Sending Action
interface SendCampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

function personalize(template: string, contact: Contact): string {
  let content = template;
  const tokens: { [key: string]: string | undefined } = {
    '{{firstName}}': contact.firstName,
    '{{lastName}}': contact.lastName,
    '{{email}}': contact.email,
    '{{company}}': contact.company,
    '{{position}}': contact.position,
  };

  for (const [key, value] of Object.entries(tokens)) {
    content = content.replace(new RegExp(key, 'gi'), value || '');
  }
  return content;
}

export async function sendCampaignAction(
  campaign: Campaign,
  contacts: Contact[],
  sender: SenderSettings
): Promise<SendCampaignResult> {
  const results: SendCampaignResult = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Check sender verification (Simulated platform check)
  if (!sender.isDomainVerified || !sender.fromEmail) {
    throw new Error("Cannot send campaign: Sender identity or domain not verified.");
  }

  for (const contact of contacts) {
    const { isValid, reason } = await validateEmailAction(contact.email);
    if (!isValid) {
      results.failed++;
      results.errors.push(`Skipped ${contact.email}: ${reason}`);
      continue;
    }

    try {
      const personalizedSubject = personalize(campaign.subject, contact);
      const personalizedBody = personalize(campaign.body, contact);

      // MOCK SENDGRID API CALL
      // console.log(`[SendGrid API] Sending to ${contact.email} from ${sender.fromEmail}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Failed to send to ${contact.email}: ${error.message}`);
    }
  }

  return results;
}
