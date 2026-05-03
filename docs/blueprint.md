# **App Name**: EmailCraft Studio

## Core Features:

- Text to Email Extraction: Allows users to paste raw text and intelligently extract unique, valid email addresses. An AI tool ensures high accuracy and can identify patterns.
- Contact List Management (Client-Side): Users can import contacts via CSV or JSON files, manually add/edit contacts, and manage lists within their browser session. Lists can be saved/loaded via local storage.
- Personalized Campaign Builder: Compose email campaign subjects and bodies with dynamic personalization tokens (e.g., {{firstName}}, {{company}}) that auto-populate with contact data.
- AI-Assisted Content Drafting: Leverages an AI tool to suggest and refine engaging email subject lines and body paragraphs, incorporating personalization tokens contextually.
- Real-time Email Validation: Performs instant syntax checks and domain (MX record) validation for email addresses during contact input and before campaign dispatch to ensure deliverability, logging invalid entries.
- Instant Campaign Dispatch (SMTP Integration): Sends personalized emails to a selected contact list immediately using user-configured SMTP settings (e.g., Brevo, SendGrid), relying on client-side-managed campaign state.
- Campaign State Local Storage: Enables saving and loading of campaign configurations (email content, selected contact lists, SMTP settings) within the browser's local storage for continuity across sessions without a backend database.

## Style Guidelines:

- Primary color: A strategic and modern blue (#3333E6) to convey precision and professionalism.
- Background color: A light, desaturated blue (#EBEBF5) for a clean and uncluttered interface, enhancing focus.
- Accent color: A vibrant, clear blue (#4EDAFF) providing visual contrast for interactive elements and highlights.
- Body and headline font: 'Inter' (sans-serif) for its modern, clean, and highly readable qualities, suitable for a productivity application.
- Use clean, minimal line-art icons that complement the professional and streamlined aesthetic, ensuring clarity and intuitive navigation.
- Implement a responsive and intuitive layout with ample whitespace, clearly defined sections for features, and logical flow for campaign creation and management. Prioritize a single-column layout on smaller screens.
- Subtle and functional animations for user feedback, such as loading indicators during email extraction or campaign dispatch, and smooth transitions between dashboard views.