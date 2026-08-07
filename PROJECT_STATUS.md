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
- Active exercise execution now opens as a native pushed page within Today's
  nested stack. Metric selectors and exercise stats are subordinate sheets,
  Previous and Next preserve the workout state, and the shared 44-point glass
  back control is fixed above the scrolling exercise content.
- Every metric uses one shared native wheel picker. Metric sheets use Expo UI's
  native content-fit detent instead of forcing the medium detent, with Cancel
  leading and Done trailing. Edits remain drafts until Done and dismissal
  reveals the same exercise page. The reps flow and working back navigation are
  verified in dark appearance on the iPhone 17 Pro Simulator running iOS 26.5.
- The new Hey FLYNT consultation uses one ElevenLabs agent for both Talk and
  Text. Talk starts the speech session over WebRTC; Text starts the same agent
  over WebSocket with text-only mode. Their introduction, chooser, conversation
  UI, composer, and transitions are unchanged by the handoff milestone.
- Native source now registers one `finish_consultation` client-tool receiver for
  both modes. It validates the version `1.0` handoff, submits it to the existing
  authenticated consultation confirmation endpoint, refreshes authoritative
  lifecycle state, and opens the existing program-build progress route.

## Current product state

### Native application

- Repository: `FLYNT-Native`
- Branch: `codex/native-foundation`
- Consultation handoff commit: `29f0d0b`.
- The native lifecycle, authentication, consultation gate, program-build
  progress, ready-state tabs, Trainer, workout editing, workout persistence,
  subscriptions, notifications, Spotify boundary, and TestFlight build
  configuration exist in source.
- The Hey FLYNT Talk and Text experience uses the same ElevenLabs agent and the
  same native consultation controller. Text is the agent's text-only transport,
  not the previous `/api/trainer` consultation.
- The Text consultation uses the native glass composer. Talk uses the existing
  voice conversation presentation. The established UI and transition behavior
  are locked for the current backend-integration work.
- Today uses a nested native stack for the workout and exercise routes. The
  exercise page owns active exercise execution; metric and stats sheets do not
  replace or dismiss that page.
- The shallow `deliver_demo_plan` receiver remains temporarily for compatibility
  with the currently configured ElevenLabs agent. Native is ready to receive the
  production versioned handoff through `finish_consultation`, but that tool and
  the completion instructions still need to be registered on the agent before
  the legacy receiver can be removed.
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

### Consultation-to-program wiring map

The intended new Talk and Text path is connected through the native receiver,
with the ElevenLabs agent configuration step still outstanding:

1. The Hey FLYNT introduction offers Talk or Text. Both choices start agent
   `agent_3501kzcymvw5fs0tqcp946q4e11d`; only the ElevenLabs transport and input
   presentation differ.
2. The agent collects the same version `1.0` information in either mode, follows
   the same nonclinical disclosure boundary, summarizes the result, accepts
   corrections, and asks for explicit confirmation.
3. After confirmation, the agent calls `finish_consultation` with the complete
   structured handoff. Native validates it against `completedConsultationSchema`
   and posts it to `POST /api/consultation/confirm` using the authoritative
   FLYNT consultation conversation ID.
4. Confirmation validates the schema, stores `consultation_snapshot` and
   `trainer_report` on the athlete profile, completes the consultation
   conversation, creates a `program_builds` record, and starts the durable
   `programBuildWorkflow`.
5. The workflow reads the stored consultation and trainer report. Initial
   prescription uses `openai/gpt-5.6-luna` at medium reasoning with the
   `flynt-ai-prescriber-2026.8` prompt and a structured program schema.
6. The committed prescriber prompt includes ownership boundaries, seven-day
   output, ordered Warm Up, Workout, optional Conditioning, optional Recovery,
   three to five specific warm-ups, recovery-day mobility and zone 2 work,
   session-duration limits, nonredundancy, movement exclusions, and explicit
   load, reps, duration, distance, or rounds tracking.
7. Program validation rejects an invalid day count, session-duration overflow,
   missing or disordered sections, umbrella exercise labels, invalid rest or
   recovery days, and metric-target mismatches before publication.
8. Downstream fulfillment resolves exercise identity, creates missing exercise
   records and media, validates fulfillment, publishes the program version,
   schedules weekly progression, and sends the ready notification.

This path is implemented locally but is not in the current TestFlight build or
confirmed through a production owner journey.

### Current model and prompt bindings

- New Talk and Text consultation: the same configured ElevenLabs agent. The
  agent's underlying language-model setting is owned by ElevenLabs and has not
  been read or changed from this repository.
- Previous server-driven text consultation: `openai/gpt-5.6-luna`, low
  reasoning. This is not the new Hey FLYNT Text path.
- Initial program prescription: `openai/gpt-5.6-luna`, medium reasoning.
- Normal Trainer chat: `openai/gpt-5.4-mini`, low reasoning.
- Exercise identity resolution: `openai/gpt-5.4-mini`.
- Exercise registry metadata and guide generation: `openai/gpt-5.4-mini`.
- Exercise visual preflight prompt and visual QA: `openai/gpt-5.4-mini`.
- Exercise image rendering: `openai/gpt-image-2`, medium quality, 1536 by 1024.

The Claude-generated program examples and retrofit document are design inputs;
they are not runtime models or files read by the production workflow. Their
ordered-section, metric, ownership, and consultation-boundary decisions have
been translated into committed validators and prompts. The larger combined
exercise-definition plus visual-slot contract has not been implemented.

The backend worktree currently contains an uncommitted
`flynt-precise-exercise-v3` visual master-style template and its test. It is
already on the code path used by local exercise image generation, but it is not
committed, pushed, deployed, or production-verified. It also does not yet merge
exercise metadata, guide instructions, relationships, and visual slots into the
single comprehensive generation call described in the retrofit document.

Semantic exercise-image QA remains disabled in source. The image model has not
changed, and no legacy exercise-library image backfill is planned.

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

### Progression and regression state

- Set-level progression is operational. The weekly engine can advance load or
  repetitions using deterministic rules and logged performance.
- Movement control is operational as a guardrail. `mixed` holds automatic
  progression; `not_controlled` stops automatic progression and flags the
  movement for regression or substitution review.
- Exercise guide generation already produces named `progressions`,
  `regressions`, and `substitutions` with an `intentPreserved` explanation, and
  stores those arrays on immutable exercise revisions.
- Those named relationships are not yet operational choices. They are JSON
  descriptions, not canonical exercise edges, and the prescriber and weekly
  engine do not currently resolve or select them automatically.
- The next exercise-pipeline milestone must resolve relationship names through
  aliases to canonical exercises, store normalized edges, and make those edges
  available to weekly review, block review, and Trainer-authored changes.

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
- The focused Talk/Text consultation handoff checks pass. The broader feature
  file passes 22 of 24 checks; its two failures are pre-existing assertions
  against unrelated local theme and exercise-surface work.
- Product copy checking passes.
- The iOS app builds and launches successfully in the iPhone 17 Pro Simulator
  on iOS 26.5.
- Dark-appearance Simulator screenshots verify the ordered Warm Up and Workout
  sections.
- Simulator interaction verifies that completed-workout history scrolls through
  the full sheet content.
- Simulator interaction verifies that an exercise opens with the native stack
  transition, its reps control opens a content-fit native wheel with Cancel and
  Done, Done returns to the same exercise page, and the shared glass back button
  returns to Today.
- Source and Simulator inspection verify that Today's menu and the exercise
  back action use the same shared 44-point circular glass control. The Today
  menu's entire visible circle is an explicit hit-test target, and the menu
  opens after a fresh Simulator reload.

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

### Exercise execution page

The current exercise page already has sets, reps, load, rest, media, guide
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

#### Exercise execution presentation milestone

The exercise is now treated as a primary workout task rather than a modal. The
implemented Today interaction is:

1. Active exercise execution is a nested native stack route that preserves the
   athlete's place in the workout.
2. Metric selectors and exercise stats are subordinate sheets, so dismissal
   always reveals the same active exercise.
3. Previous and Next change the active exercise without changing completion or
   persistence semantics.
4. Metric selectors use the shared native wheel, Cancel and Done, draft edits,
   and a content-fit native detent. Stats retain the approved full sheet detent.
5. The shared 44-point circular glass header control is used for Today actions
   and the fixed exercise-page back action.

Remaining interaction work is a full selector audit plus accessibility and
appearance verification. Previous and Next currently update the routed
exercise in place; further directional animation is not yet implemented.

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
2. One native `finish_consultation` receiver for Talk and Text, strict schema
   validation, authenticated confirmation, lifecycle refresh, and build-progress
   navigation: implemented and locally tested.
3. Register `finish_consultation` and its generated JSON schema on the existing
   ElevenLabs agent. Append the approved summary, correction, confirmation, and
   nonclinical completion instructions without changing the working greeting.
4. Run Talk and Text through the configured tool, then remove the legacy
   `deliver_demo_plan` compatibility receiver.
5. Confirm minimum audio retention and transcript handling, then update the
   privacy disclosure.
6. Verify Talk and Text produce equivalent stored handoffs and each starts only
   one idempotent program build.

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
   committed in backend commit `54767c2`.
4. Add metric-aware program exercise prescription and workout logging:
   complete in backend commit `95a46e4` and the current native milestone.
5. Finalize the remaining program-exercise schema.
6. Finalize exercise revision capabilities and canonical relations.
7. Keep `openai/gpt-image-2` for rendering and choose the final comprehensive
   exercise-definition model.
8. Implement the combined exercise-definition, guide, relationship, and visual
   slot contract. The local uncommitted visual v3 master template is only a
   partial step.
9. Add schema versioning, migrations, validators, and publication
   gates.
10. Update the exercise page and weekly review UI for the new fields. The
    metric-aware controls and navigated exercise-execution page are complete;
    weekly review remains.

### Workstream D: release validation

1. Run the complete native feature-contract suite and separate unrelated local
   theme failures from this milestone.
2. Run the complete native and backend suites on Node 24.14.0.
3. Run a fresh-account Talk journey from consultation through ready state.
4. Repeat with Text and compare stored handoffs.
5. Verify malformed and incomplete handoffs do not start builds.
6. Verify light and dark appearance, safe areas, Dynamic Type, VoiceOver,
   Reduce Motion, and Reduce Transparency.
7. Verify on a physical iPhone.
8. Create a new production build. Build 4 cannot validate this work.

## Current blockers

1. Native is ready for the production handoff, but the existing ElevenLabs
   agent has not yet been configured to call `finish_consultation`. No
   ElevenLabs management credential is available in the current environment.
2. Equipment and movement preferences are not durable independent resources.
3. Pace and completion-only tracking are not in the current five-metric
   contract.
4. Current local native work contains unrelated uncommitted changes.
5. Two pre-existing native source-contract assertions fail against unrelated
   local theme and exercise-surface work.
6. Current consultation and program-pipeline work is not in TestFlight.
7. Exercise-definition, guide, and image prompt restructuring remains pending.
8. Semantic exercise-image QA remains disabled.
9. The local visual v3 master-template change is uncommitted and unverified in
   a complete exercise-generation run.
10. Named exercise progressions, regressions, and substitutions are stored as
    revision JSON but are not normalized or consumed automatically.

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
