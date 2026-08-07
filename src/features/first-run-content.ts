export type FirstRunPreviewKind = 'today' | 'timer' | 'guide' | 'progress' | 'trainer' | 'spotify';

export const firstRunSlides: readonly {
  body: string;
  kind: FirstRunPreviewKind;
  title: string;
}[] = [
  {
    title: 'Your training, in focus.',
    body: 'See the day, open the current movement, and move through every set without losing your place.',
    kind: 'today',
  },
  {
    title: 'The right rest is already built in.',
    body: 'Every exercise brings its programmed rest with it, keeping the session at the pace your plan calls for.',
    kind: 'timer',
  },
  {
    title: 'A custom guide for every exercise.',
    body: 'Each movement gets its own visual and step-by-step guidance, built to match the equipment, setup, support, range, and constraints in your program.',
    kind: 'guide',
  },
  {
    title: 'Progress you can actually use.',
    body: 'Every completed set builds a clear history of load, effort, and how the movement felt.',
    kind: 'progress',
  },
  {
    title: 'A trainer that knows your plan.',
    body: 'Talk through movement changes, schedule changes, or a hard session and review every adjustment before it happens.',
    kind: 'trainer',
  },
  {
    title: 'Your music stays in the workout.',
    body: 'See what is playing on Spotify and control it without leaving your session.',
    kind: 'spotify',
  },
] as const;

export const accountCopy = {
  create: 'Create a new account to build your training around you and keep every session synced.',
  recovery: 'Enter your email and we’ll send a secure sign-in code. FLYNT does not use account passwords.',
  signIn: 'Sign in to your existing account to access your program, progress, and Trainer history.',
} as const;

export const flyntLegalVersion = '2026-07-27';
