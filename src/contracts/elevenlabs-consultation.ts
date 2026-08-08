import { z } from 'zod';

import { completedConsultationSchema } from './app-state';

export const elevenLabsReviewConsultationTool = {
  name: 'review_consultation',
  parameterName: 'consultation_json',
  description: [
    'Present the complete consultation in the native FLYNT review card before final submission.',
    'Call this after collecting every required field and before asking for approval.',
  ].join(' '),
  parameters: z.toJSONSchema(completedConsultationSchema, {
    target: 'draft-7',
  }),
} as const;

export function parseElevenLabsConsultationParameters(parameters: Record<string, unknown>) {
  const encoded = parameters[elevenLabsReviewConsultationTool.parameterName];
  if (typeof encoded !== 'string') return completedConsultationSchema.safeParse(parameters);

  try {
    let decoded: unknown = encoded;
    for (let layer = 0; layer < 4; layer += 1) {
      if (typeof decoded === 'string') {
        decoded = JSON.parse(decoded);
        continue;
      }
      if (
        decoded
        && typeof decoded === 'object'
        && elevenLabsReviewConsultationTool.parameterName in decoded
        && typeof (decoded as Record<string, unknown>)[elevenLabsReviewConsultationTool.parameterName] === 'string'
      ) {
        decoded = (decoded as Record<string, unknown>)[elevenLabsReviewConsultationTool.parameterName];
        continue;
      }
      break;
    }
    return completedConsultationSchema.safeParse(decoded);
  } catch {
    return completedConsultationSchema.safeParse(null);
  }
}
