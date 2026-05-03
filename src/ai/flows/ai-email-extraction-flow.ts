'use server';
/**
 * @fileOverview This file contains a Genkit flow for intelligently extracting
 * unique and valid email addresses along with associated names and company info from a given text block.
 *
 * - extractContacts: A function to initiate the contact extraction process.
 * - AiContactExtractionInput: The input type for the extractContacts function.
 * - AiContactExtractionOutput: The return type for the extractContacts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractedContactSchema = z.object({
  email: z.string().email().describe('A valid email address.'),
  firstName: z.string().optional().describe('The first name of the person.'),
  lastName: z.string().optional().describe('The last name of the person.'),
  company: z.string().optional().describe('The company the person works for.'),
  position: z.string().optional().describe('The job title or position of the person.'),
});

const AiEmailExtractionInputSchema = z.object({
  text: z.string().describe('The text block from which to extract contact information.'),
});
export type AiEmailExtractionInput = z.infer<typeof AiEmailExtractionInputSchema>;

const AiEmailExtractionOutputSchema = z.object({
  contacts: z
    .array(ExtractedContactSchema)
    .describe('An array of unique contact objects extracted from the text.'),
});
export type AiEmailExtractionOutput = z.infer<typeof AiEmailExtractionOutputSchema>;

export async function extractEmails(input: AiEmailExtractionInput): Promise<AiEmailExtractionOutput> {
  return aiEmailExtractionFlow(input);
}

const aiEmailExtractionPrompt = ai.definePrompt({
  name: 'aiEmailExtractionPrompt',
  input: {schema: AiEmailExtractionInputSchema},
  output: {schema: AiEmailExtractionOutputSchema},
  prompt: `You are an expert at identifying and extracting contact information from unstructured text.
Your task is to analyze the provided text and return a list of unique contacts found.
For each contact, try to identify:
1. Email address (Required)
2. First Name
3. Last Name
4. Company Name
5. Job Position

Ensure that the output contains only unique email addresses. If multiple entries for the same email exist, merge the associated info (preferring the most complete names/company).

Text to analyze: {{{text}}}`, 
});

const aiEmailExtractionFlow = ai.defineFlow(
  {
    name: 'aiEmailExtractionFlow',
    inputSchema: AiEmailExtractionInputSchema,
    outputSchema: AiEmailExtractionOutputSchema,
  },
  async (input) => {
    const {output} = await aiEmailExtractionPrompt(input);
    if (!output) {
      throw new Error('Failed to extract contacts: AI returned no output.');
    }
    return output;
  },
);
