
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

/**
 * PAYSTACK PAYMENT INITIALIZATION
 */
export async function initializePaymentAction(email: string, amount: number) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET_KEY) {
    // Prototype mode: Return a simulation signal if no key is found
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
        amount: amount * 100, // Paystack amount is in kobo
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002"}/api/paystack/verify`,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Paystack Init Error:", error);
    throw new Error("Failed to initialize payment.");
  }
}
