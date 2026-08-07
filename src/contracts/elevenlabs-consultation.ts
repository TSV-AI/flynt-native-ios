import { z } from 'zod';

import { completedConsultationSchema } from './app-state';

export const elevenLabsFinishConsultationTool = {
  name: 'finish_consultation',
  description: [
    'Submit the athlete consultation only after summarizing it and receiving explicit confirmation.',
    'Return the complete FLYNT consultation handoff. Do not generate a workout program in this tool.',
  ].join(' '),
  parameters: z.toJSONSchema(completedConsultationSchema, {
    target: 'draft-7',
  }),
} as const;

export const elevenLabsConsultationCompletionInstructions = `Before finishing, summarize the athlete's goals, schedule, training background, equipment, preferences, exclusions, ownership choice, and readiness in three or four concise sentences. Ask what should be corrected. Call finish_consultation only after the athlete explicitly confirms the summary. Submit schemaVersion 1.0 and every required field. Do not create or preview the workout program inside the conversation. FLYNT builds the program after this handoff is validated.`;
