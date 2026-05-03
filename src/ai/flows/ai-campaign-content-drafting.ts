'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-assisted email campaign content drafting.
 * It helps campaign creators draft engaging email subject lines and body content, including personalization tokens.
 *
 * - draftCampaignContent - A function that handles the AI content drafting process.
 * - AICampaignContentDraftingInput - The input type for the draftCampaignContent function.
 * - AICampaignContentDraftingOutput - The return type for the draftCampaignContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AICampaignContentDraftingInputSchema = z.object({
  campaignName: z.string().describe('The name or purpose of the email campaign.'),
  emailSubjectPrompt: z
    .string()
    .describe('User\u0027s initial idea or keywords for the email subject line.'),
  emailBodyPrompt: z.string().describe('User\u0027s initial idea or draft for the email body content.'),
  availableTokens: z
    .array(z.string())
    .describe('A list of personalization tokens available for use (e.g., {{firstName}}, {{company}}).'),
});
export type AICampaignContentDraftingInput = z.infer<typeof AICampaignContentDraftingInputSchema>;

const AICampaignContentDraftingOutputSchema = z.object({
  suggestedSubject: z.string().describe('The AI-suggested engaging email subject line.'),
  suggestedBody: z.string().describe('The AI-suggested engaging email body content.'),
});
export type AICampaignContentDraftingOutput = z.infer<typeof AICampaignContentDraftingOutputSchema>;

export async function draftCampaignContent(
  input: AICampaignContentDraftingInput
): Promise<AICampaignContentDraftingOutput> {
  return aiCampaignContentDraftingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCampaignContentDraftingPrompt',
  input: { schema: AICampaignContentDraftingInputSchema },
  output: { schema: AICampaignContentDraftingOutputSchema },
  prompt: `You are an expert marketing copywriter specializing in email campaign content. Your goal is to draft an engaging email subject line and body content for a campaign.
You MUST incorporate the provided personalization tokens accurately. Do NOT invent new tokens or change existing ones. Only use the tokens provided in the 'Available Tokens' list.

Campaign Context:
The campaign is named "{{{campaignName}}}".

User's Initial Subject Idea: "{{{emailSubjectPrompt}}}"
User's Initial Body Idea: "{{{emailBodyPrompt}}}"

Available Tokens for Personalization:
{{#each availableTokens}}- {{{this}}}
{{/each}}

Please generate an engaging subject line and email body content.`,
});

const aiCampaignContentDraftingFlow = ai.defineFlow(
  {
    name: 'aiCampaignContentDraftingFlow',
    inputSchema: AICampaignContentDraftingInputSchema,
    outputSchema: AICampaignContentDraftingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
