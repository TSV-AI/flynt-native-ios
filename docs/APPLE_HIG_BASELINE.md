# FLYNT Apple design authority

Reviewed against current Apple guidance: 2026-08-01

This document turns Apple's current Human Interface Guidelines into the
operational design standard for FLYNT. Apple remains authoritative. This file
does not freeze Apple's website or replace it. It makes the rules efficient and
repeatable for every person or coding agent working in this repository.

## Authority and scope

Use this order when sources appear to disagree:

1. Current Apple Human Interface Guidelines and Apple platform documentation
   govern iOS behavior, control semantics, accessibility, privacy, and system
   integration.
2. This document governs the repository's design process and acceptance checks.
3. `docs/INTERACTION_SYSTEM.md` governs FLYNT-specific presentation, motion,
   haptics, and interaction decisions that fit within Apple's guidance.
4. The FLYNT PWA governs product content, feature coverage, brand direction,
   and established information hierarchy.
5. Existing native code is precedent only when it agrees with the sources
   above.

Apple guidance is principles-based, not a pixel specification. FLYNT may have a
distinct visual identity, but custom styling must preserve familiar iOS
behavior, legibility, adaptability, and accessibility.

Every statement in the sections labeled Apple-derived is a concise paraphrase
of the linked first-party source. Everything labeled FLYNT policy is a product
decision, repository acceptance rule, or implementation choice. Never describe
a FLYNT policy as an Apple requirement.

## Source-grounded decision note

Create this note in task commentary before a material screen or interaction
change. Retain it in `PROJECT_STATUS.md` when it establishes or changes a
reusable pattern.

```text
Person's task:
Official Apple pages checked:
Apple-derived requirements:
System primitive selected:
FLYNT specialization and tokens:
States and accessibility conditions:
Departure from Apple guidance: none, or approved record link
Verification to run:
```

Only official Apple Developer sources can populate Apple-derived requirements.
If Apple does not specify a dimension, color, radius, spacing value, or exact
composition, say so and make the choice through the FLYNT token system.

## Mandatory design pass

Before changing a screen, component, navigation path, material, motion, or
haptic behavior, answer these questions:

1. What is the person's primary task and what information is essential now?
2. Is this a peer destination, hierarchical destination, focused task, compact
   command set, binary preference, or destructive confirmation?
3. Which system navigation and control primitives already match that need?
4. What are the loading, empty, error, disabled, success, interruption,
   offline, and restored states that apply?
5. Which shared FLYNT tokens and components express the result without adding a
   local variant?
6. How does it behave with large text, VoiceOver, Switch Control, Reduce Motion,
   Reduce Transparency, increased contrast, and one-handed reach?
7. What evidence will prove the design works on the supported device bounds?

If a question has no answer, the design is not ready to implement.

## Apple source map

This table is the fast entry point. Open the linked page before changing the
corresponding interaction family because Apple can revise its guidance.

| Decision family | Current first-party source | Source-backed requirement used by FLYNT |
| --- | --- | --- |
| Overall design | [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios), [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) | Start from purpose, preserve clarity and familiarity, and earn trust through safety, privacy, and transparency. |
| Adaptive layout | [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Respect safe areas and system guides, adapt to screen and context changes, support Dynamic Type, and preview boundary layouts. |
| Type | [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Prefer built-in text styles, support Dynamic Type and accessibility sizes, and keep custom type legible and adaptable. |
| Color | [Color](https://developer.apple.com/design/human-interface-guidelines/color) | Use color consistently and verify light, dark, and increased-contrast contexts. |
| Materials | [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Choose material by semantic function, preserve hierarchy and legibility, and account for system appearance settings. |
| Top-level navigation | [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Use tabs for top-level navigation, keep them available, preserve section state, include concise labels, and avoid using tabs as actions. |
| Contextual commands | [Menus](https://developer.apple.com/design/human-interface-guidelines/menus) | Use concise outcome labels, prioritize and group commands, show unavailable states, and avoid excessive depth or length. |
| Buttons | [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | Provide at least a 44 by 44 point hit region, visible press state for custom buttons, adequate separation, and clear action hierarchy. |
| Interruptions | [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) | Use alerts sparingly for critical, actionable information. Prefer contextual presentation for nonblocking information and action sheets for choices tied to an intentional action. |
| Symbols | [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols) | Use scalable system symbols for familiar interface concepts, respect availability, and do not misuse protected Apple-product symbols. |
| Accessibility | [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | Make the interface intuitive, perceivable, and adaptable; support larger text and assistive technologies; do not rely on one sensory channel. |
| Motion | [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Use motion to communicate status, feedback, or instruction, provide nonvisual reinforcement where appropriate, and account for motion sensitivity. |
| Haptics | [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) | Use standard meanings consistently, maintain clear cause and effect, complement other feedback, avoid overuse, and keep haptics optional. |
| Permissions and data | [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy) | Request protected access through the system, explain the specific benefit in plain language, request in context, and avoid manipulative pre-alerts. |

## Platform rules

### Structure and presentation, Apple-derived

- Keep the primary purpose clear and avoid unnecessary complexity. Source:
  [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles).
- Use a tab bar for top-level navigation, not actions. Keep destinations
  consistently available, preserve each section's state, include concise text
  labels, and prefer familiar SF Symbols. Source:
  [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars).
- Choose navigation and presentation components by their documented role.
  Sources: [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search),
  [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets).
- Use a menu for contextual commands. Keep labels concise, group related
  actions, show unavailable commands, and avoid unnecessary depth. Source:
  [Menus](https://developer.apple.com/design/human-interface-guidelines/menus).
- Use alerts sparingly for critical and actionable information. Present
  nonblocking information in context, and use an action sheet instead of an
  alert for choices related to an intentional action. Source:
  [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts).
- Respect safe areas, the keyboard, the home indicator, system bars, and native
  presentation behavior. Sources:
  [Layout](https://developer.apple.com/design/human-interface-guidelines/layout),
  [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets).

### Controls and actions, Apple-derived

- Prefer system controls because they provide familiar behavior, accessibility,
  interaction states, and appearance adaptation. Sources:
  [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Give every control a hit region of at least 44 by 44 points, even when its
  visible symbol is smaller. Source:
  [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).
- Give custom controls visible pressed, focused, disabled, selected, loading,
  and error states where applicable. The visible pressed state is an explicit
  Apple button requirement; the complete state set is a FLYNT acceptance rule.
  Source: [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).
- Use one visually prominent action for the clearest primary action. Keep
  secondary and destructive actions visually distinct. Sources:
  [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons),
  [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts).
- Label actions by their outcome. A symbol-only action requires a standard,
  unambiguous SF Symbol and an accessibility label. Sources:
  [Menus](https://developer.apple.com/design/human-interface-guidelines/menus),
  [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

### Layout, type, color, and materials, Apple-derived

- Build layouts that reflow instead of clipping or shrinking essential content.
  Source: [Layout](https://developer.apple.com/design/human-interface-guidelines/layout).
- Use Dynamic Type and built-in text styles where possible. Essential
  instructions and values must remain legible at accessibility sizes. Sources:
  [Typography](https://developer.apple.com/design/human-interface-guidelines/typography),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Keep the experience perceivable without relying on a single sensory channel.
  Source: [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Use semantic colors and test both appearances, increased contrast, and color
  differentiation settings. Sources:
  [Color](https://developer.apple.com/design/human-interface-guidelines/color),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Choose materials for hierarchy and function, not for the tint they happen to
  produce. Navigation and controls may occupy a material layer above content;
  content surfaces should not become layers of decorative glass. Source:
  [Materials](https://developer.apple.com/design/human-interface-guidelines/materials).
- Maintain legibility over every material. Supply a solid or more opaque
  fallback for Reduce Transparency and visually complex backgrounds. Sources:
  [Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Use SF Symbols for standard interface concepts. Match their weight and scale
  to adjacent text and provide text when a symbol alone is ambiguous. Source:
  [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols).

### Motion and haptics, Apple-derived

- Motion explains hierarchy, continuity, status, or direct manipulation. It is
  not decoration. Source:
  [Motion](https://developer.apple.com/design/human-interface-guidelines/motion).
- Prefer system transitions. Custom motion must be interruptible and have a
  Reduce Motion alternative that preserves meaning. Sources:
  [Motion](https://developer.apple.com/design/human-interface-guidelines/motion),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Haptics must have a clear cause and effect, complement visible feedback, use
  standard meanings, avoid overuse, and remain optional. Source:
  [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics).

### Accessibility, trust, and safety, Apple-derived

- Treat accessibility as part of the initial design, not a later audit.
- Expose concise VoiceOver labels, values, traits, hints only when needed, and a
  logical focus order. Decorative images are hidden from assistive technology.
- Keep core tasks possible without precise gestures, time-limited controls,
  audio, haptics, color discrimination, or motion.
- Ask permission in context and explain the direct benefit before invoking the
  system prompt. Permission purpose strings must be specific, active, brief,
  and easy to understand. Sources:
  [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- Protect personal and training information in previews, notifications, logs,
  widgets, screenshots, and account transitions. Source:
  [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy).

The first three accessibility bullets above derive from
[Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## FLYNT specialization policy

These are deliberate product and repository rules. Apple does not prescribe
their exact composition or token values.

- Use push navigation for hierarchical FLYNT exploration and editing that needs
  a clear back path.
- Use a sheet for a focused, self-contained FLYNT task that preserves context.
  Drill into the same editing sheet instead of stacking routine modal choices.
- Do not recreate a switch, picker, segmented control, slider, date control,
  text field, menu, alert, or sheet when the system primitive satisfies the
  requirement.
- Use shared theme and component tokens for exact colors, radii, spacing,
  typography, opacity, borders, and materials. Apple usually does not specify
  these product values.
- Brand marks and exercise visuals are product assets, not substitutes for
  standard interface symbols.
- Use the semantic functions in `src/lib/haptics.ts`. Do not call raw vibration
  or device patterns from feature code, and do not duplicate feedback already
  supplied by a system control.
- Use plain, respectful, beginner-safe product language. Do not imply diagnosis,
  guaranteed outcomes, or emergency support.
- Declining Spotify or another optional integration must preserve a useful app.

## Definition of design complete

Check only what was actually run and record the evidence in
`PROJECT_STATUS.md` for material work.

### Design and implementation

- [ ] The primary task and action hierarchy are obvious.
- [ ] Navigation and presentation use the correct native primitive.
- [ ] The implementation composes shared tokens and components without an
      unexplained local variant.
- [ ] Loading, empty, error, disabled, success, interruption, and recovery
      states that apply are implemented.
- [ ] Destructive actions are separated and confirmed using native semantics.
- [ ] Custom controls have a visible response and at least a 44 by 44 point hit
      region.
- [ ] Materials preserve hierarchy and legibility and have an accessible
      fallback.
- [ ] Copy states the outcome clearly and contains no em dash.

### Accessibility and adaptation

- [ ] Light and dark appearances preserve hierarchy and contrast.
- [ ] Dynamic Type, including accessibility sizes, does not hide the task or
      required actions.
- [ ] VoiceOver names, values, traits, order, and dismissal paths are correct.
- [ ] Switch Control and keyboard focus can reach every required action.
- [ ] Reduce Motion preserves meaning without required animation.
- [ ] Reduce Transparency and increased contrast preserve legibility.
- [ ] The smallest and largest supported iPhones preserve safe areas, keyboard
      access, and one-handed interaction.

### Evidence

- [ ] Type, lint, and relevant automated tests pass.
- [ ] Relevant states are verified in Simulator and identified by device and OS.
- [ ] Physical-device-only behavior such as haptics is labeled unverified until
      tested on an iPhone.
- [ ] Intentional departures are recorded below and approved by the owner.
- [ ] `PROJECT_STATUS.md` distinguishes implemented source from every level of
      verification.

## Departure record

Record an entry before implementing a deliberate exception:

| Date | Surface | Apple guidance affected | Product reason | Accessible alternative | Owner approval |
| --- | --- | --- | --- | --- | --- |
| None | None | None | None | None | None |

An existing implementation is not justification for a departure. If the need
is temporary, include the removal condition in the product reason.

## Current official sources

Recheck the relevant pages whenever Apple updates them, at every release
milestone, and before introducing a new interaction family.

- [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)
- [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search)
- [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Menus](https://developer.apple.com/design/human-interface-guidelines/menus)
- [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy)
