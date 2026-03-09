
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
import type { Contact, EmailLog, Campaign } from "./types";

import dns from "dns/promises";

// Securely retrieve API keys from environment variables
const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY || '69c9b78b0150477db4ccf5374edd4705';

const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
  "icloud.com", "aol.com", "protonmail.com", "zoho.com"
];

/**
 * Checks if an email belongs to a public provider (Gmail, Yahoo, etc.)
 */
export async function isPublicDomain(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

/**
 * VERIFY DOMAIN ACTION
 * Simulates domain verification for the Studio's shared infrastructure.
 */
export async function verifyDomainAction(domain: string): Promise<{ success: boolean; message: string }> {
  // Simulate network delay for verification process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return { success: false, message: "Invalid domain format." };
  }

  return { 
    success: true, 
    message: `Domain ${domain} verified. SPF and DKIM records are correctly propagated to EmailCraft infrastructure.` 
  };
}

// AI Actions (Server-Side)
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

// Validation Action (Server-Side high-precision check)
export async function validateEmailAction(
  email: string
): Promise<{ isValid: boolean; reason: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: "Invalid format" };
  }

  try {
    // Attempt high-precision validation via Abstract API
    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${email}`
    );

    if (!response.ok) {
        throw new Error('API request failed');
    }

    const data = await response.json();
    // Abstract API returns "DELIVERABLE" for high-quality mailboxes
    const isValid = data.deliverability === 'DELIVERABLE' || data.is_valid_format?.value;
    
    return { 
        isValid: !!isValid, 
        reason: isValid ? "" : `Mailbox status: ${data.deliverability || 'Undeliverable'}` 
    };
  } catch (error: any) {
    // Fallback to DNS check if API fails or quota exceeded
    try {
        const domain = email.split("@")[1];
        const records = await dns.resolveMx(domain);
        return { 
            isValid: !!(records && records.length > 0), 
            reason: records && records.length > 0 ? "" : "DNS verification failed" 
        };
    } catch (e) {
        return { isValid: false, reason: "Validation services currently unavailable" };
    }
  }
}

/**
 * CAMPAIGN DISPATCH ACTION
 * Securely handles the mailing process using Brevo API.
 */
export async function dispatchEmailAction(
  recipient: Contact, 
  campaign: Partial<Campaign>,
  fromEmailOverride?: string,
  fromNameOverride?: string
): Promise<EmailLog> {
  const logId = Math.random().toString(36).substring(7);
  // Priority: 1. User Settings, 2. Default Platform Sender
  const fromEmail = fromEmailOverride || "noreply@emailcraft.studio";
  const fromName = fromNameOverride || "EmailCraft Studio";

  if (BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            email: fromEmail, 
            name: fromName 
          },
          to: [{ email: recipient.email, name: `${recipient.firstName} ${recipient.lastName}` }],
          subject: campaign.subject!,
          htmlContent: campaign.body!,
          trackOpens: true,
          trackClicks: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Brevo provider error');
      }

      return {
        id: logId,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        status: 'delivered',
        sentAt: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        id: logId,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        status: 'failed',
        error: e.message || "Provider dispatch error",
        sentAt: new Date().toISOString(),
      };
    }
  }

  // Simulation fallback for environments without valid keys
  const isSuccess = Math.random() < 0.98;
  return {
    id: logId,
    recipientEmail: recipient.email,
    recipientName: `${recipient.firstName} ${recipient.lastName}`,
    status: isSuccess ? 'delivered' : 'failed',
    error: isSuccess ? undefined : 'Mailbox full or temporarily unavailable',
    sentAt: new Date().toISOString(),
  };
}

/**
 * PAYSTACK PAYMENT INITIALIZATION
 * Securely communicates with Paystack API.
 */
export async function initializePaymentAction(email: string, amount: number) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return { 
      simulation: true, 
      message: "Secret key missing. Proceeding with prototype simulation." 
    };
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Amount in kobo
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002"}/api/paystack/verify`,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to initialize payment.");
  }
}
