# FLYNT interaction system

This document defines the default behavior language for the native app.
Exceptions require a product reason and an update here.

Apple's current Human Interface Guidelines govern platform behavior,
accessibility, and native component selection. Read
`docs/APPLE_HIG_BASELINE.md` first for the authority order, mandatory design
pass, and completion checklist. This document specializes that standard for
FLYNT without replacing it.

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
| Choose among primary app areas | Accessible bottom tab bar |
| Make a focused, reversible choice | Sheet |
| Inspect or edit one item | Sheet or pushed detail, based on depth |
| Change a binary preference | Inline system switch |
| Choose one of several settings | Bottom sheet on iPhone, popover on iPad |
| Confirm destructive work | Native destructive action sheet |
| Explain a blocking failure | Anchored error with retry and escape |
| Show program publication | Authoritative full-screen lifecycle state |

Settings remains a pushed page. Preference sheets stay anchored to the row that
opened them and preserve the surrounding Settings context. Centered floating
modals are reserved for neither routine choices nor multi-step editing. Alerts
appear only when a blocking message needs the athlete's full attention.
Destructive confirmation uses an action sheet on iPhone.

App Settings uses SwiftUI Form, Section, Toggle, Button, and Picker controls.
Appearance is an inline System, Light, and Dark segmented picker. Routine binary
preferences stay in aligned native toggle rows. Profile is a designed product
surface with identity, personal metrics, and Trainer context. Editing personal
or training context happens in focused sheets instead of expanding the page
into a long field list.

Primary segmented controls use the large native control size. Data actions do
not share a cramped row group. Sign out, export, and account deletion use the
same 50-point height and 16-point corner radius as Profile actions. In light
mode Sign Out is black, Export is white with a subtle boundary, and account
deletion uses a translucent red fill with a matching red border and label.

FLYNT sheets use a shared native SwiftUI bottom-sheet presentation, including
system detents, grabbers, rounded chrome, and the home-indicator safe area. The
surface inverts against the app appearance. Dark mode receives a bright
warm-white sheet, while light mode receives a dark sheet. The native
presentation background and React Native content must receive the same color
scheme. A choice within an open editing sheet drills into that sheet instead of
stacking another modal over it.

The primary bottom navigation remains a full-width, edge-attached surface. It
uses native glass with SF Symbols and labels, and keeps the same dark treatment
in light and dark app appearances. Light-mode Today uses a slightly darker
canvas with `#FAFAFA` exercise cards and a restrained mode-aware edge bevel.

## Apple interface baseline

- Every interactive target is at least 44 by 44 points.
- Related buttons use identical dimensions and at least 12 points of visual
  separation when stacked.
- A prominent fill is reserved for the action with the clearest hierarchy.
- Destructive actions use the destructive semantic role and require a native
  confirmation path before data loss.
- Settings use native Form, Section, Toggle, Picker, and row behavior unless a
  documented product need requires a custom surface.
- Controls adapt to light and dark appearance, Dynamic Type, VoiceOver, Reduce
  Motion, and safe areas.
- Custom buttons must retain a visible pressed state and semantic haptic token.

Primary references: [Apple Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
[Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility),
[Apple Settings](https://developer.apple.com/design/human-interface-guidelines/settings),
and [Apple Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios/).

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
