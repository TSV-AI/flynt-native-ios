# FLYNT Current State and Consultation Integration Hub

Updated: 2026-08-07

## Purpose

This document is the current implementation hub for the FLYNT native app, the
authoritative FLYNT backend, the consultation handoff, and the work required to
connect them.

The consultation decisions supplied on 2026-08-07 replace the older
consultation question set and data contract. The old consultation is not an
equivalent source of the required information.

This pass defines the information FLYNT must collect and how that information
enters the existing backend. Model selection, workout-generation prompts,
exercise-generation prompts, image-generation prompts, and their model choices
are the next workstream and are intentionally not redesigned here.

## Implementation update

The consultation and first pipeline milestones are now implemented beyond the
planning state originally captured below:

- Native commit `3cbaee5` and backend commit `0762aac` replace routine pain
  scoring with nonclinical movement control.
- Backend commit `1ce989d` and native commit `29f0d0b` implement the strict
  consultation handoff schema version `1.0`, persist the full handoff, and keep
  historical snapshots readable without carrying clinical explanations into
  the new contract.
- The linked Supabase project is accessible and healthy. Migration
  `20260807182427_add_workout_set_control.sql` is applied in production, local
  and remote migration histories match, and live public-schema lint reports no
  errors.
- New program prescriptions now require ordered Warm Up, Workout, optional
  Conditioning, and optional Recovery sections. Training days require three to
  five specific warm-up movements. Recovery days require specific mobility and
  zone 2 entries. Legacy published programs remain readable.
- Native Today renders the prescribed exercise roles as section headers without
  duplicating program state. This is verified in dark appearance on an iPhone
  17 Pro Simulator running iOS 26.5.
- Completed-workout history sheets on Progress now use a native SwiftUI scroll
  container. Scrolling is verified in the same Simulator.
- Backend commit `95a46e4` and the current native milestone implement
  metric-aware workout logging end to end. New prescriptions select no more
  than two meaningful metrics from load, reps, duration, distance, and rounds.
  Today renders only those controls, workout history formats the recorded
  values, and legacy programs still default to load and repetitions without a
  backfill.
- Every metric uses one shared native wheel picker. It presents at the system
  medium detent with Cancel leading and Done trailing, holds edits as a draft,
  and returns to the same exercise sheet after either action. This behavior is
  verified for Bike Sprint duration in dark appearance on the iPhone 17 Pro
  Simulator.

## Current product state

### Native application

- Repository: `FLYNT-Native`
- Branch: `codex/native-foundation`
- Consultation handoff commit: `29f0d0b`.
- The native lifecycle, authentication, consultation gate, program-build
  progress, ready-state tabs, Trainer, workout editing, workout persistence,
  subscriptions, notifications, Spotify boundary, and TestFlight build
  configuration exist in source.
- The Talk and Text ElevenLabs experience exists as a standalone native
  consultation prototype.
- The Text consultation uses the shared chat thread and native glass composer.
- The standalone voice prototype still returns a shallow demo plan. The
  production text consultation and backend now use the versioned handoff.
- Local source contains unrelated uncommitted lifecycle, Settings, theme, and
  sheet changes. Those changes must be preserved and reviewed separately.

### Backend and program pipeline

- Repository: `FLYNT-Web App`
- Branch: `main`
- The backend remains authoritative for profiles, conversations, program
  building, exercise identity, exercise media, publication, weekly programs,
  workout history, and progression decisions.
- `POST /api/consultation/confirm` already persists a consultation snapshot,
  updates the athlete lifecycle, creates an idempotent program build, and starts
  the durable program-build workflow.
- The program-build workflow already generates a prescription, resolves
  exercise identities, creates missing guides and visuals, validates the
  result, publishes a program version, and schedules the first program week.
- Weekly review tables and deterministic weekly adjustment code already exist.
- Backend commit `1ce989d` implements `trainingIntent`, self-directed and hybrid
  ownership, the versioned handoff, persistence, and legacy read compatibility.
- Backend commit `54767c2` enforces ordered program sections while preserving
  compatibility with older published programs.
- Backend commit `95a46e4` adds metric-aware workout API persistence and the
  additive workout-set migration. Unrelated exercise-image prompt work remains
  uncommitted and outside this milestone.

### Database

The configured FLYNT Supabase project is `nnfxswxzjqocnlkoqsbl`.

The McGlynn Supabase account can access the linked project. The project reports
`ACTIVE_HEALTHY`. Local and remote migrations match through
`20260807203000`, and `supabase db lint --linked --schema public --level
warning` reports no schema errors. A local catalog dump was not run because
Docker Desktop is not running; this did not block remote migration or lint
verification.

The migration source currently defines:

- `athlete_profiles`, including `consultation_snapshot jsonb` and
  `trainer_report jsonb`.
- `trainer_conversations` and `trainer_messages`.
- `program_builds`, `program_versions`, `program_cycles`, and
  `program_weeks`.
- `exercise_canonicals`, immutable `exercise_revisions`, aliases, media,
  and generation infrastructure.
- `weekly_program_reviews` and `weekly_review_decisions`.
- `workout_sessions` and `workout_sets`.
- Account isolation and row-level security for athlete-owned data.

There is no separate durable athlete equipment profile. Exact equipment
is currently embedded in consultation JSON. Exercise relations are stored as
JSON descriptions and are not guaranteed to resolve to canonical exercise
records.

### TestFlight

- EAS confirms production build `1.0.0 (4)` finished successfully.
- EAS build ID: `71fc8450-a15e-4d0b-af09-6c38f71c8d77`.
- Build 4 was created from commit `9d23483`, before the current ElevenLabs
  consultation and composer commits.
- Repository release evidence records build 4 as validated and attached to the
  internal `Team (Expo)` group.
- Installation and a complete owner journey on build 4 remain unverified.
- The current local consultation work is not in TestFlight.

## Verification state on 2026-08-07

### Native checks run

- TypeScript passes after the consultation, program-section, Progress sheet,
  and metric-aware workout changes.
- Metric-aware source-contract tests pass. The broader targeted feature file
  passes 22 of 23 checks; its only failure is the pre-existing onboarding
  appearance assertion against unrelated local theme work.
- Product copy checking passes.
- The iOS app builds and launches successfully in the iPhone 17 Pro Simulator
  on iOS 26.5.
- Dark-appearance Simulator screenshots verify the ordered Warm Up and Workout
  sections.
- Simulator interaction verifies that completed-workout history scrolls through
  the full sheet content.
- Simulator interaction verifies the Bike Sprint duration control opens a
  native wheel picker at the medium detent with Cancel and Done. Done returns
  to the still-open Bike Sprint exercise sheet.

All local checks ran under Node 22.23.1. The repository requires Node 24.14.0.

### Backend checks run

- The full recovery suite passes 102 of 102 tests, including the versioned
  consultation contract, nonclinical exclusion enforcement, program
  prescribing, metric selection, weekly progression, block review, and media
  policy.
- Trainer and consultation acceptance passes 35 of 35 checks.
- TypeScript passes.
- ESLint reports zero errors and three pre-existing warnings.
- Program-section tests verify three to five warm-ups, ordered sections,
  recovery mobility, and zone 2 guidance.
- Metric-contract tests verify legacy compatibility, required new-prescription
  tracking, target-to-metric consistency, and prescriber instructions that
  prohibit irrelevant load or repetition fields.
- The additive workout-set migration is applied to the linked production
  project, local and remote migration histories match, and live public-schema
  lint reports no errors.

### Not yet verified

- Production ElevenLabs JSON handoff through the backend.
- Talk and Text parity against the final contract.
- Complete consultation to program-build to ready-state journey.
- Current local source in TestFlight.
- Physical iPhone behavior.
- VoiceOver, larger Dynamic Type, Reduce Motion, and Reduce Transparency for
  the complete revised consultation.
- Light-appearance verification of the new Today section labels.

## Authoritative consultation decisions

### Experience

- FLYNT begins the conversation.
- Talk and Text collect the same information and return the same JSON contract.
- The target duration is about five minutes.
- The consultation is completed in one sitting.
- An incomplete consultation is discarded and restarted.
- Ask one clear question at a time.
- Give examples when a question is broad.
- Ask a follow-up only when its answer changes programming.
- Allow natural spoken or typed responses.
- Suggested responses submit immediately.
- Before completion, summarize the important information and allow correction.
- On completion, explain that FLYNT is starting the program and that progress
  can be monitored. Offer build-completion notifications in context.

### Tone

FLYNT is warm, confident, approachable, quietly optimistic, capable, casual,
relatable, and lightly playful when natural.

Avoid repeated use of the athlete's name, robotic acknowledgements, constant
praise, canned jokes, forced sarcasm, slang-heavy banter, teasing,
overexplaining, and visible audio-direction tags.

### Required information

The consultation must collect:

1. Preferred name, age, height, weight, and training experience.
2. Program ownership: `coached`, `self_directed`, or `hybrid`.
3. Exact workouts, exercises, methods, or structure that must be preserved for
   self-directed and hybrid athletes.
4. Primary goals, desired changes, focus areas, and measurable success.
5. Realistic days per week, session duration, available days, constraints,
   sports and activity, and schedule variability.
6. Recent consistency, current programming, movement preferences, exclusions,
   styles to preserve, and areas where guidance is wanted.
7. Presumed equipment, confirmed equipment, explicitly unavailable equipment,
   and real load increments.
8. Nonclinical programming signals for recovery and movement control.

### Nonclinical boundary

The consultation must not ask for or investigate:

- Diagnoses.
- Injury history.
- Pain location or severity.
- Symptoms.
- Medical restrictions.
- Medications.
- Rehabilitation details.
- The reason an athlete wants to avoid a movement.

If the athlete voluntarily discloses pain, injury, or another medical issue,
FLYNT briefly acknowledges it without diagnosis or investigation. FLYNT does
not provide rehabilitation advice. The affected movement is not automatically
progressed. The athlete can exclude it or use a normal programming regression,
and professional guidance is recommended when warranted.

An athlete preference exclusion is stored without a requested explanation:

```json
{
  "name": "movement name",
  "status": "excluded",
  "source": "athlete_preference",
  "reason": null
}
```

## Final ElevenLabs consultation handoff

This is the production output contract for both Talk and Text. It describes the
athlete and the programming requirements. It does not create a workout, mutate
program tables, or create exercise-library records.

```json
{
  "schemaVersion": "1.0",
  "trainingIntent": "coached",
  "summary": "Concise human-readable summary of the confirmed consultation.",
  "coachingPriorities": [
    "Build useful full-body strength",
    "Make three weekly sessions sustainable"
  ],
  "profile": {
    "name": "Luke",
    "age": 30,
    "height": {
      "feet": 5,
      "inches": 8
    },
    "weightLb": 175,
    "experience": "some"
  },
  "objectives": {
    "primaryGoals": [
      "Get stronger",
      "Build consistency"
    ],
    "focusAreas": [],
    "successMeasures": [
      "Complete three sessions most weeks",
      "Add load or repetitions while maintaining control"
    ]
  },
  "schedule": {
    "daysPerWeek": 3,
    "sessionMinutes": 60,
    "availableDays": [
      "Monday",
      "Wednesday",
      "Friday"
    ],
    "constraints": [],
    "sportsAndActivity": []
  },
  "programOwnership": {
    "mode": "coached",
    "preserve": [],
    "athleteSuppliedWorkouts": []
  },
  "trainingBackground": {
    "consistency": "on_and_off",
    "dailyActivity": "mixed",
    "preferredMovements": [],
    "excludedMovements": []
  },
  "equipmentProfile": {
    "environment": "commercial_gym",
    "presumed": [],
    "confirmed": [
      "barbell",
      "adjustable_bench",
      "dumbbells",
      "cable_station"
    ],
    "unavailable": [],
    "incrementsLb": {
      "barbell": 5,
      "dumbbells": 5
    }
  },
  "readiness": {
    "recovery": "ready",
    "movementControl": "controlled",
    "intensityPreference": "moderate"
  },
  "unknowns": [],
  "confidence": "high"
}
```

### Contract rules

- `schemaVersion` is exactly `1.0`.
- `trainingIntent` is exactly the value selected during setup. The agent does
  not infer or replace it.
- `programOwnership.mode` must exactly equal `trainingIntent`.
- `coached` may have empty preservation arrays.
- `self_directed` must include at least one supplied workout or preserved
  structure.
- `hybrid` must include at least one preserved workout, exercise, method, or
  structural requirement.
- Height, weight, frequency, and duration are numeric, not prose.
- Available days are concise weekday strings.
- Equipment values are concise normalized labels accepted by FLYNT.
- Presumed, confirmed, and unavailable equipment cannot contain the same item.
- A full gym is an environment classification, not proof that every specialty
  implement is available.
- Known load increments are stored by equipment in `incrementsLb`.
- Exclusion `reason` is always null in the consultation handoff.
- Required unanswered fields cause rejection. `unknowns` is only for optional
  or genuinely unconfirmed details and contains validated field paths.
- `confidence` describes handoff completeness, not medical certainty.
- The agent returns one final JSON object only after the athlete confirms the
  summary.
- Server-owned metadata such as user ID, ElevenLabs conversation ID, modality,
  agent version, timestamps, and idempotency keys is added by FLYNT. It is not
  trusted from agent-generated JSON.

## Difference from the current contracts

### Current production consultation

The native and backend `completedConsultationSchema` now implement version
`1.0` with numeric profile data, structured objectives and schedule,
program-ownership boundaries, daily activity, equipment states and increments,
nonclinical readiness, unknowns, and confidence.

The production server rejects ownership mismatches and rejects medical or
personal explanations in preference exclusions. Existing historical snapshots
remain readable through a legacy adapter. The adapter deliberately does not
carry old limitations or medical text into the new contract and marks movement
exclusions for reconfirmation instead of guessing.

### Current ElevenLabs prototype

The prototype returns `title`, `summary`, `days`, `exercises`, and
`guidance`. That output is useful only for testing conversation delivery. It
must be replaced by the consultation handoff above. ElevenLabs must not author
the production workout.

### Current program prescription

The backend program schema supports exercise identity, sets, reps, rest, target
load, target RPE, role, and a prose progression rule. New prescriptions now
enforce ordered Warm Up, Workout, optional Conditioning, and optional Recovery
sections. It does not yet have a complete typed contract for:

- Progression metric.
- Athlete-specific increment policy.
- Qualification criteria.
- Movement-control and repeatability evidence.
- Resolvable progression and regression edges.
- Exercise-specific tracking metrics such as duration, distance, pace, rounds,
  or completion-only mobility work.

Those belong to the next program-pipeline workstream. The consultation contract
should be implemented first so the pipeline receives correct inputs.

## Data ownership

### ElevenLabs owns

- Live speech and text interaction.
- Question sequencing within the approved consultation policy.
- The final candidate JSON handoff.

### FLYNT backend owns

- Authentication and account identity.
- Conversation and modality metadata.
- JSON validation and schema versioning.
- Consultation persistence.
- Equipment and exclusion persistence.
- Program creation and publication.
- Exercise identity and exercise-library records.
- Workout history.
- Weekly and block-level progression.
- Safety boundaries, idempotency, retry, and lifecycle state.

### Native app owns

- Talk and Text presentation.
- Input, transcript, summary, correction, and completion states.
- Sending the final handoff to FLYNT.
- Showing authoritative build progress and ready-state data.
- Athlete-controlled editing of equipment and movement preferences after
  consultation.

## Migration and implementation plan

No database migration is required merely to store the new JSON because
`athlete_profiles.consultation_snapshot` and
`trainer_conversations.structured_answers` are JSONB. A migration is required
only when the information must be independently edited, queried, or evaluated.

### Migration 0: live schema reconciliation, complete

Supabase access is restored. The linked project is healthy, migration history
matches source, the pending movement-control migration was dry-run before
application, and live public-schema lint is clean. A Docker-backed local catalog
dump remains optional follow-up evidence.

### Migration 1: durable athlete equipment profile

Create one athlete-owned equipment profile with:

- `user_id` primary key.
- `environment`.
- `presumed`, `confirmed`, and `unavailable` canonical equipment values.
- `load_increments` as validated JSONB.
- `source_consultation_version`.
- `created_at` and `updated_at`.

Add owner-read RLS and service-role writes. Validate disjoint inventories and
the load-increment shape in both application code and database checks.

Reason: equipment is a mutable athlete resource used after consultation. It
should not remain trapped in one historical snapshot.

### Migration 2: durable movement preferences

Create an athlete-owned movement-preference table with:

- `user_id`.
- Canonical exercise ID when resolved.
- Normalized movement label when unresolved.
- `status`, initially `preferred` or `excluded`.
- `source`, initially `athlete_preference` or `observed_behavior`.
- Nullable `reason`, constrained to null for athlete preference exclusions.
- `automatic_progression_enabled`.
- Timestamps and a uniqueness constraint.

Reason: exclusions must be editable, enforceable by the prescriber and weekly
engine, and usable when an athlete repeatedly skips a movement.

### Migration 3: program schema versioning

Add an explicit schema version to program builds, versions, and weeks, or make
it a required top-level property in every program JSON and enforce it at every
publication boundary. Existing rows remain readable through a legacy parser.

Reason: the next workstream will expand the athlete-specific program exercise
contract. Versioning must precede that rollout.

### Migration 4: nonclinical movement control, complete for set tracking

New set logging uses `controlled`, `mixed`, or `not_controlled`. Routine pain
collection is removed from the active client and RPC. Historical `pain` data is
retained for compatibility and was not destructively deleted. Session recovery,
confidence, repeatability, and explicit exclusion requests remain later
extensions.

### Next-workstream migrations

The following should be designed with the program, exercise, image, prompt, and
model changes, not guessed in this consultation pass:

- A fixed exercise `slot` taxonomy.
- Equipment access tier derived from exact equipment requirements.
- Canonical exercise-relation records for progression, regression, and
  substitution edges.
- Exercise-level progression capabilities.
- Athlete-specific program-exercise metric, increment policy, qualification,
  and progression rule.

Do not place athlete-specific default sets, loads, equipment stacks, deload
percentages, or phase eligibility in `exercise_revisions`. Exercise revisions
describe what a movement supports. Program exercises describe what this athlete
should do.

## Backend changes required before migrations 1 through 4

1. Add a strict versioned Zod schema for the handoff above.
2. Replace the legacy completed-consultation tool schema.
3. Replace the standalone ElevenLabs plan tool with a handoff-delivery tool.
4. Bind the setup-selected `trainingIntent` server-side and reject a mismatch.
5. Attach trusted ElevenLabs conversation metadata server-side.
6. Validate the handoff before displaying the final confirmation.
7. Let the athlete correct the summary and regenerate the candidate handoff.
8. Submit the confirmed handoff to one authoritative confirmation endpoint.
9. Persist the consultation snapshot and concise trainer report.
10. Upsert the equipment profile and movement preferences transactionally.
11. Start the existing idempotent program build.
12. Return authoritative lifecycle state instead of simulated local progress.
13. Keep legacy snapshot parsing read-only for existing athletes.
14. Add contract tests for malformed JSON, missing required data, intent
    mismatch, duplicate equipment states, incomplete self-directed data,
    idempotent retries, and one-sitting discard behavior.

## Native changes required

1. Make Talk and Text use the same consultation session controller.
2. Pass the selected training intent and trusted session context to the backend.
3. Replace demo-plan state with the versioned handoff state.
4. Add the confirmed-summary and correction step.
5. On confirmation, call the authoritative backend once with an idempotency key.
6. Transition to the existing real `program_building` screen.
7. Remove the demo plan renderer from the production consultation path.
8. Remove local fake build progress.
9. Discard incomplete consultation state when the athlete exits and start a new
   session on return.
10. Keep Settings and sign-out reachable while the consultation gate is active.
11. Add post-consultation equipment and movement-preference editing after the
    backend resources exist.

## Where the new data is used in the app

### Profile and Settings

- Training intent.
- Primary goals and success measures.
- Real weekly availability and session duration.
- Confirmed equipment and load increments.
- Preferred and excluded movements.
- Preserved workouts or methods for hybrid and self-directed training.

### Today and Plan

- Available days and session duration determine scheduling.
- Exact equipment filters exercise selection.
- Preserved workouts constrain program authorship.
- Exclusions prevent selection and automatic progression.
- Recovery can modify the active prescription without asking health questions.

### Exercise sheet

The current exercise sheet already has sets, reps, load, rest, media, guide
steps, and completion controls. The next program-pipeline workstream can add:

- The current progression metric.
- The next qualifying target.
- The athlete's actual available increment.
- A short explanation of why load, reps, time, distance, or range was held or
  advanced.
- A normal regression or substitution when available.
- Exclude-from-program action.

The immediate UI and data-model gap is metric-aware tracking. An exercise must
declare the metrics that apply so the sheet never shows meaningless empty load
or repetition controls:

- Strength: load and repetitions, with optional RPE and movement control.
- Bodyweight: repetitions, with optional assistance or added load.
- Timed mobility or stretching: duration and completion.
- Walking and cardio: duration with optional distance, pace, and effort.
- Carries: distance or duration with optional load.
- Recovery and mobility: duration, rounds, or completion.

Legacy exercises will default to the current load-and-repetition presentation.
New prescriptions will emit an explicit tracking kind and allowed metrics. The
database change must be additive so historical workout sets remain readable.

#### Exercise execution presentation follow-up

Metric selection is now uniform and safe inside the current exercise sheet,
but the exercise itself is a primary workout task rather than a short modal
task. The next Today interaction milestone should:

1. Move active exercise execution to a navigated workout page that preserves
   the athlete's place in the workout.
2. Present metric selectors and exercise stats from that page as subordinate
   sheets, so dismissal always reveals the same active exercise.
3. Add Previous and Next exercise navigation without changing completion or
   persistence semantics.
4. Keep metric selectors on the shared medium-detent wheel with Cancel and Done
   unless a metric supports a more direct native control.
5. Audit every remaining selector for the same Cancel, Done, draft, detent, and
   return-to-context behavior.

This is a future interaction milestone, not part of the metric persistence
migration. Do not add another loading transition or duplicate workout state to
implement it.

Do not expose raw model reasoning, diagnostic language, or medical explanations.

### Weekly review

- Use adherence and completed set history passively.
- Ask only the approved nonclinical recovery and movement-quality questions
  required for programming.
- Apply deterministic changes and record the evidence and rule IDs.
- Use the four-week review only for bounded structural decisions.

## Ordered next steps

### Workstream A: consultation contract, backend schema complete

1. Shared handoff schema in backend and native code: complete.
2. Replace the ElevenLabs demo-plan delivery tool.
3. Update the agent policy to collect every required field and obey the
   nonclinical boundary.
4. Implement summary, correction, confirmation, and one-sitting discard.
5. Wire confirmation to the existing authoritative build endpoint.
6. Verify Talk and Text produce equivalent validated handoffs.

### Workstream B: persistence

1. Restore live FLYNT Supabase access and reconcile schema: complete.
2. Apply equipment-profile and movement-preference migrations.
3. Transactionally persist those records during consultation confirmation.
4. Add Settings editing and account-isolation tests.

### Workstream C: program, exercise, and media pipeline

This is the next design session:

1. Program-prescription model is currently GPT-5.6 Luna.
2. Final handoff is connected to the prescription prompt.
3. Ordered Warm Up, Workout, Conditioning, and Recovery generation is
   implemented in source and awaiting commit.
4. Add metric-aware program exercise prescription and workout logging:
   complete in backend commit `95a46e4` and the current native milestone.
5. Finalize the remaining program-exercise schema.
6. Finalize exercise revision capabilities and canonical relations.
7. Keep the existing image model and choose the exercise-definition model.
8. Rewrite exercise and image prompts.
9. Add schema versioning, migrations, validators, and publication
   gates.
10. Update the exercise sheet and weekly review UI for the new fields. The
    metric-aware exercise controls are complete; weekly review and the
    navigated exercise-execution page remain.

### Workstream D: release validation

1. Resolve the current native feature-contract failure.
2. Run the complete native and backend suites on Node 24.14.0.
3. Run a fresh-account Talk journey from consultation through ready state.
4. Repeat with Text and compare stored handoffs.
5. Verify malformed and incomplete handoffs do not start builds.
6. Verify light and dark appearance, safe areas, Dynamic Type, VoiceOver,
   Reduce Motion, and Reduce Transparency.
7. Verify on a physical iPhone.
8. Create a new production build. Build 4 cannot validate this work.

## Current blockers

1. Talk still uses the standalone ElevenLabs demo-plan contract instead of the
   production consultation handoff.
2. Equipment and movement preferences are not durable independent resources.
3. Active exercise execution still uses a sheet. Metric selectors now return
   correctly to it, but the planned navigated exercise page and Previous/Next
   controls are not implemented.
4. Pace and completion-only tracking are not in the current five-metric
   contract.
5. Current local native work contains unrelated uncommitted changes.
6. One pre-existing native onboarding source-contract assertion fails against
   unrelated local theme work.
7. Current consultation and program-pipeline work is not in TestFlight.
8. Exercise-definition, guide, and image prompt restructuring remains pending.

## Acceptance gate for the consultation integration

The consultation integration is complete only when:

- Talk and Text collect the same required information.
- Neither path asks for medical or injury investigation.
- Both return the same strict schema version.
- The athlete confirms or corrects the summary.
- Malformed or incomplete handoffs are rejected.
- Trusted metadata is supplied by FLYNT, not the agent.
- The snapshot, equipment, and exclusions persist under the correct account.
- One idempotent program build starts.
- The native app shows the real build lifecycle.
- An incomplete session is discarded and restarts cleanly.
- Account isolation and row-level security pass.
- The complete flow is verified in Simulator, TestFlight, and on a physical
  iPhone with the applicable accessibility states.

## Evidence used for this update

- Consultation decision record supplied on 2026-08-07.
- Current `FLYNT-Native` source and last 20 commits.
- Current `FLYNT-Web App` source, local diffs, and migration history.
- EAS read-only build query on 2026-08-07.
- Native test, typecheck, lint, and copy-check runs on 2026-08-07.
- Focused backend test run on 2026-08-07.

The previous contents of this file were not used as authority for the current
state.
