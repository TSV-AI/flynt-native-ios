# FLYNT interaction system

This document defines the default behavior language for the native app.
Exceptions require a product reason and an update here.

## Core principles

- Native controls first.
- Touch targets are at least 44 by 44 points.
- Every modal surface has an obvious dismissal.
- Every authenticated lifecycle retains Settings and sign out.
- Loading preserves spatial context.
- Optimistic UI is reserved for reversible changes.
- Motion communicates state and respects Reduce Motion.
- Haptics confirm intent or durable results. They do not decorate navigation.
- Product copy is concise, human, beginner-safe, and free of em dashes.

## Presentation

| Need | Presentation |
| --- | --- |
| Move to a peer destination | Stack navigation |
| Choose among primary app areas | Native tab bar |
| Make a focused, reversible choice | Sheet |
| Inspect or edit one item | Sheet or pushed detail, based on depth |
| Confirm destructive work | Native confirmation dialog |
| Explain a blocking failure | Anchored error with retry and escape |
| Show program publication | Authoritative full-screen lifecycle state |

## Haptics

| Semantic request | Native feedback |
| --- | --- |
| `selection` | Selection feedback |
| `directManipulation` | Light impact |
| `deliberateAction` | Medium impact |
| `saved` | Success notification after server truth |
| `warning` | Warning notification |
| `failed` | Error notification once |

System controls keep their system feedback. Do not add a second haptic.

## Motion

- Quick state response: 160 ms.
- Standard content transition: 240 ms.
- Deliberate reveal: 360 ms.
- Dismissals reverse their entrance.
- Interactive motion must be interruptible.
- Reduced-motion mode uses opacity and immediate state replacement where needed.

## Consultation boundary

The consultation remains a hybrid Trainer conversation. Native cards, sliders,
pickers, and selectors reduce effort, while text and dictation preserve the
athlete's own words. The client collects the complete prescriber contract. It
does not shrink or redefine that contract.

Until the evolving consultation design is locked, it lives behind a lifecycle
adapter. Work on identity, authoritative boot, the design system, and workout
surfaces must not depend on a particular consultation screen sequence.
