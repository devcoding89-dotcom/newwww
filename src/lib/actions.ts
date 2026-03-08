
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
import sgMail from "@sendgrid/mail";

/**
 * PLATFORM-MANAGED INFRASTRUCTURE (Twilio SendGrid API Integration)
 */

// CONFIGURE YOUR SENDGRID API KEY HERE
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "YOUR_SENDGRID_API_KEY"; 
sgMail.setApiKey(SENDGRID_API_KEY);

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
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (domain.includes(".")) {
    return { success: true, message: "Domain DNS records verified successfully!" };
  }
  return { success: false, message: "Could not find valid DNS records for this domain." };
}

// Personalization Helper
function personalize(template: string, contact: Contact): string {
  let content = template;
  const tokens: { [key: string]: string | undefined } = {
    '{{firstName}}': contact.firstName,
    '{{lastName}}': contact.lastName,
    '{{name}}': `${contact.firstName} ${contact.lastName}`.trim(),
    '{{email}}': contact.email,
    '{{company}}': contact.company,
    '{{position}}': contact.position,
  };

  for (const [key, value] of Object.entries(tokens)) {
    content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value || '');
  }
  return content;
}

// Bulk Send Logic (API-based queued sending)
export async function processBatchAction(
  campaign: Campaign,
  batchContacts: Contact[],
  sender: SenderSettings
): Promise<{ sent: number; failed: number; logs: any[] }> {
  const logs: any[] = [];
  let sent = 0;
  let failed = 0;

  for (const contact of batchContacts) {
    const personalizedBody = personalize(campaign.body, contact);
    const personalizedSubject = personalize(campaign.subject, contact);

    const msg = {
      to: contact.email,
      from: {
        name: sender.fromName,
        email: sender.fromEmail,
      },
      subject: personalizedSubject,
      html: personalizedBody,
    };

    try {
      if (SENDGRID_API_KEY === "YOUR_SENDGRID_API_KEY") {
        // PROTOTYPE MODE: Simulate API latency and success
        await new Promise(r => setTimeout(r, 100));
      } else {
        await sgMail.send(msg);
      }
      
      sent++;
      logs.push({
        recipientEmail: contact.email,
        status: "delivered",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      failed++;
      logs.push({
        recipientEmail: contact.email,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return { sent, failed, logs };
}
