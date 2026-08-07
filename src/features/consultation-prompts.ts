import type { ConsultationBasics } from '@/contracts/app-state';

export type ConsultationPrompt = {
  choices: readonly (readonly [string, string])[];
  detail: string;
  eyebrow: string;
  title: string;
};

const outcomePrompt = (name: string): ConsultationPrompt => ({
  eyebrow: 'START IN YOUR OWN WORDS',
  title: `${name || 'Tell me'}, what would you most like training to change?`,
  detail: 'Choose a starting point or use the message field below.',
  choices: [
    ['Feel stronger', 'My main goal is to feel stronger and more capable in everyday life.'],
    ['Build muscle', 'My main goal is to build visible muscle and change how my body looks.'],
    ['Move and feel better', 'My main goal is to have more energy and move with more confidence.'],
    ['Train for something', 'My main goal is to prepare for a sport, event, or performance target. I’m preparing for: . Success would look like: .'],
  ],
});

const existingWorkoutsPrompt: ConsultationPrompt = {
  eyebrow: 'YOUR CURRENT PROGRAM',
  title: 'What workouts do you want to bring into FLYNT?',
  detail: 'Describe the days, exercises, sets, reps, and progression you already use.',
  choices: [
    ['I have a full program', 'I already follow a complete program. My weekly schedule, exercises, sets, reps, and progression are: '],
    ['I have a few workouts', 'I have workouts I want to keep, but they are not a complete program. What I currently do is: '],
    ['I need help organizing it', 'I have exercises and workout ideas I like, but I need help organizing them into a usable week. What I want to keep is: '],
  ],
};

const hybridPrompt: ConsultationPrompt = {
  eyebrow: 'WHAT STAYS YOURS',
  title: 'What should FLYNT build, and what do you want to keep?',
  detail: 'Start with the training you already value and the gaps you want FLYNT to fill.',
  choices: [
    ['Keep my main lifts', 'Build the overall plan, but keep these main lifts or workouts from my current training: '],
    ['Build the base', 'Build the main structure for me. I expect to add or adjust this work myself: '],
    ['Blend two approaches', 'Blend what I already do with FLYNT programming. My current training is: . The help I want is: .'],
  ],
};

export function consultationPromptForTurn(
  turn: number,
  name: string,
  trainingIntent: ConsultationBasics['trainingIntent'],
): ConsultationPrompt {
  if (turn === 0) {
    if (trainingIntent === 'self_directed') return existingWorkoutsPrompt;
    if (trainingIntent === 'hybrid') return hybridPrompt;
    return outcomePrompt(name);
  }
  if (turn === 1) return {
    eyebrow: trainingIntent === 'self_directed' ? 'WHY THIS PROGRAM MATTERS' : 'MAKE THE GOAL CONCRETE',
    title: trainingIntent === 'self_directed'
      ? 'What should your current training help you accomplish?'
      : 'What would make that feel like real progress?',
    detail: 'This gives FLYNT a clear way to judge success.',
    choices: [
      ['Stronger in real life', 'My main goal is useful full-body strength. I’ll know it’s working when everyday tasks and the same exercises feel easier and I can steadily do more.'],
      ['Visible muscle', 'My main goal is visible muscle. My focus areas are: . I’ll judge success through progress photos, measurements, how clothes fit, and stronger performance.'],
      ['Move with confidence', 'My main goal is comfortable, confident movement. I’ll know it’s working when I move through daily life and training with less hesitation.'],
      ['Something else', 'My main goal and the result that would show real progress are: '],
    ],
  };
  if (turn === 2) return {
    eyebrow: 'YOUR REAL WEEK', title: 'What does training need to fit around?', detail: 'Include your available days, session length, schedule, other activity, and whether your day is mostly seated, mixed, or on your feet.',
    choices: [
      ['2 shorter days', 'I can train 2 days per week for up to 45 minutes. I have no major schedule constraints and no regular sport demands. My daily activity is mostly: seated, mixed, or on my feet.'],
      ['3 balanced days', 'I can train 3 days per week for up to 60 minutes. I have no major schedule constraints and no regular sport demands. My daily activity is mostly: seated, mixed, or on my feet.'],
      ['4 focused days', 'I can train 4 days per week for up to 60 minutes. I have no major schedule constraints and no regular sport demands. My daily activity is mostly: seated, mixed, or on my feet.'],
      ['My week varies', 'My schedule changes week to week. A realistic training week looks like: . My session time limit is: . My sports or other regular activities are: . My daily activity is mostly: seated, mixed, or on my feet.'],
    ],
  };
  if (turn === 3) return {
    eyebrow: 'YOUR TRAINING BACKGROUND',
    title: trainingIntent === 'coached' ? 'What has training felt like so far?' : 'What parts of your training should FLYNT preserve?',
    detail: 'Include what you enjoy and anything you would rather avoid.',
    choices: [
      ['Starting fresh', 'I’m mostly starting fresh and do not have established movement preferences yet. There are no exercises I already know I want to avoid.'],
      ['On and off', 'I’ve trained on and off, but consistency has been difficult. I’m open to most movement styles and do not have an exercise preference or avoidance I feel strongly about yet.'],
      ['Consistent lately', 'I’ve trained consistently recently. What has worked well is: . Movements I prefer are: . Movements I avoid are: .'],
    ],
  };
  if (turn === 4) return {
    eyebrow: 'WHAT YOU HAVE', title: 'What equipment can you reliably use?', detail: 'Describe your normal environment, not equipment you only sometimes have.',
    choices: [
      ['Bodyweight only', 'I usually train with bodyweight only and no equipment.'],
      ['Home basics', 'I usually train at home. I reliably have dumbbells or kettlebells plus: .'],
      ['Full gym', 'I train at a fully equipped gym with barbells, dumbbells, cables, machines, benches, and cardio equipment.'],
      ['Something else', 'My normal training location and complete equipment setup are: '],
    ],
  };
  if (turn === 5) return {
    eyebrow: 'RECOVERY READINESS', title: 'How ready do you usually feel to train?', detail: 'Cover sleep, stress, recovery, and any movements you already prefer to exclude. You do not need to explain why.',
    choices: [
      ['Usually ready', 'My sleep is generally consistent, stress is manageable, and I usually recover well. I have no movements I want excluded.'],
      ['Readiness varies', 'My sleep, stress, or recovery can be inconsistent. I usually feel: . Movements I want excluded are: none.'],
      ['Exclude a movement', 'My recovery readiness is generally: . Please exclude or regress these movements without asking me for a medical reason: .'],
    ],
  };
  return {
    eyebrow: 'READY WHEN YOU ARE', title: 'Review what FLYNT understood.', detail: 'Nothing is built until you confirm the complete profile.',
    choices: [['Show my review', 'Show me the complete consultation summary so I can confirm or edit every detail before you build my program.']],
  };
}
