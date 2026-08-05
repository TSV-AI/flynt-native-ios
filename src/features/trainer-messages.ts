import type { AppState, CompletedConsultation, ProgramChange } from '@/contracts/app-state';
import { completedConsultationSchema, programChangeSchema } from '@/contracts/app-state';

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function programChangeOperationDescription(operation: ProgramChange['operations'][number]) {
  if (operation.type === 'replace_exercise') return `Replace ${operation.exerciseId} with ${operation.replacement.name}`;
  if (operation.type === 'update_exercise') return `Adjust ${operation.exerciseId}`;
  if (operation.type === 'add_exercise') return `Add ${operation.exercise.name}`;
  if (operation.type === 'remove_exercise') return `Remove ${operation.exerciseId}`;
  return `Update ${dayLabels[operation.dayIndex] ?? `day ${operation.dayIndex + 1}`}`;
}

export type TrainerMessage = NonNullable<AppState['conversation']>['messages'][number];

type ToolPart = {
  approval?: { approved?: boolean; reason?: string };
  input?: unknown;
  output?: unknown;
  state?: string;
  toolCallId?: string;
  type?: string;
};

export function textFromTrainerMessage(message: TrainerMessage) {
  return message.parts.flatMap((part) => {
    if (!part || typeof part !== 'object') return [];
    const candidate = part as { type?: unknown; text?: unknown };
    return candidate.type === 'text' && typeof candidate.text === 'string' && candidate.text.trim()
      ? [candidate.text.trim()]
      : [];
  }).join('\n');
}

export function consultationIsReadyForReview(messages: TrainerMessage[]) {
  const latestAssistantText = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  if (!latestAssistantText) return false;

  const text = textFromTrainerMessage(latestAssistantText).toLowerCase();
  return [
    /\b(?:have|got)\s+(?:all\s+the\s+)?(?:information|details|context|everything|enough)\b[\s\S]*\b(?:build|review|plan|program)\b/,
    /\benough\s+(?:information|detail|context)?\s*(?:to|for)\s+(?:build|review|the\s+plan|the\s+program)\b/,
    /\bready\s+(?:for|to)\s+(?:review|build|confirm)\b/,
    /\bconfirm\s+(?:the|your)\s+consultation\s+profile\b[\s\S]*\bbuild\s+(?:the|your)\s+plan\b/,
  ].some((pattern) => pattern.test(text));
}

function toolParts(messages: TrainerMessage[], type: string) {
  return messages.flatMap((message) => message.parts.flatMap((part) => {
    if (!part || typeof part !== 'object') return [];
    const candidate = part as ToolPart;
    return candidate.type === type ? [candidate] : [];
  }));
}

export function consultationReview(messages: TrainerMessage[]): { consultation: CompletedConsultation; part: ToolPart } | null {
  const parts = toolParts(messages, 'tool-finishConsultation');
  for (const part of [...parts].reverse()) {
    if (part.state !== 'approval-requested' && part.state !== 'approval-responded' && part.state !== 'output-available') continue;
    const parsed = completedConsultationSchema.safeParse(part.output ?? part.input);
    if (parsed.success && part.toolCallId) return { consultation: parsed.data, part };
  }
  return null;
}

export function programChangeReviews(messages: TrainerMessage[]): { change: ProgramChange; part: ToolPart }[] {
  return toolParts(messages, 'tool-proposePlanChange').flatMap((part) => {
    const parsed = programChangeSchema.safeParse(part.output ?? part.input);
    return parsed.success && part.toolCallId ? [{ change: parsed.data, part }] : [];
  });
}

export function messagesWithToolApproval(messages: TrainerMessage[], toolCallId: string, approved: boolean, reason: string) {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts.map((part) => {
      if (!part || typeof part !== 'object' || !('toolCallId' in part) || part.toolCallId !== toolCallId) return part;
      const candidate = part as ToolPart;
      return {
        ...candidate,
        state: 'approval-responded',
        approval: { ...candidate.approval, approved, reason },
      };
    }),
  }));
}

export function requestMessages(messages: TrainerMessage[], text: string) {
  return [
    ...messages.map(({ id, parts, role }) => ({ id, parts, role })),
    {
      id: `native:${Date.now()}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text }],
    },
  ];
}
