# Skill Grove Roadmap

This document defines the current product positioning for Skill Grove. It is not just a backlog. It explains why the product should exist, why a user should return to it, and how future features should be judged.

See [README.md](../README.md) for the public-facing overview.

## North Star

Skill Grove is a calm, local-first workspace for understanding and tending a personal Agent Skill ecosystem.

The product should help a user answer three questions quickly:

1. What skills do I really have?
2. Which ones are drifting, duplicated, or worth revisiting?
3. What should I do next to keep this library clear and trustworthy?

If a new feature does not make one of those answers faster, clearer, or safer, it is probably not the right next step.

## Why This Product Exists

Agent Skills are becoming a real layer in how people work with AI tools, but the ecosystem is fragmented.

- The same skill often exists in several agent directories at once.
- Small edits create long-lived variants.
- Descriptions can affect routing behavior.
- Users rarely have a clear view of what each agent can discover or load.
- Personal libraries become harder to trust as they grow.

Most tools stop at browsing files. Skill Grove should go one step further and help users build a usable mental model of their own skill ecosystem.

## Why A User Should Open Skill Grove

Skill Grove should earn repeat opens through clear value, not novelty.

People should open the app when they want to:

- re-orient themselves after skill changes
- inspect what changed since the last visit
- resolve duplicate or drifting variants
- find the canonical source they should keep editing
- understand where a skill exists across agents
- spot skills that may deserve cleanup because they are inconsistent, overly heavy, or poorly described

This product is not a dashboard people stare at all day. It is a trusted local companion they return to whenever their skill library starts to feel fuzzy.

## Product Positioning

### What Skill Grove is

Skill Grove is:

- a local library for your Agent Skills
- a variant-aware inspection tool
- a gentle maintenance surface for personal skill ecosystems
- a context-aware product that helps explain how skills are likely to behave across agents

### What Skill Grove is not

Skill Grove is not:

- a skill marketplace
- a public registry
- a team admin console
- a SaaS-style governance dashboard
- a bulk destructive cleanup utility
- a full skill authoring IDE

We should resist any feature that drags the product into enterprise posture too early.

## Product Principles

### 1. Value before inventory

The product should not feel like a file browser with better styling. It should help users make better decisions about their skill ecosystem.

### 2. Calm, not empty

The interface should stay quiet and focused, but it must still explain hidden structure. Calm does not mean opaque.

### 3. Variant-first understanding

Users care more about content versions and divergence than about a flat list of paths.

### 4. Local-first trust

The product should work on local files, avoid unnecessary cloud assumptions, and prefer reversible actions.

### 5. Explain uncertainty honestly

Because different agents implement skill discovery differently, Skill Grove should present estimates, support matrices, and confidence levels instead of pretending to know every runtime detail.

### 6. Guide the next action

Seeing is not enough. The product should help users decide what to do next: inspect, edit, share, consolidate, or leave something alone.

## Core Product Model

Skill Grove should continue to model the library like this:

```text
Skill
  -> Variant
    -> Source
```

### Skill

The high-level capability the user recognizes, such as `find-skills` or `release-skills`.

### Variant

A distinct content version of that skill. Variants are where drift becomes visible.

### Source

A concrete path on disk for one instance of a variant. Sources are where actions happen.

This model stays central because it matches the real maintenance problem: users are not managing abstract skill names, they are managing duplicated, drifting implementations across tools.

## Core User Loop

The intended user loop should look like this:

1. Discover
   Skill Grove scans local directories and assembles the library.
2. Re-orient
   The user sees what changed, what drifted, and what looks worth attention.
3. Inspect
   The user opens a skill, compares variants, and understands where each source lives.
4. Decide
   The user identifies a canonical source or chooses to leave the library unchanged.
5. Act
   The user opens a source, edits it, shares it, converts duplicates to symlinks, or removes a source safely.
6. Return
   The next visit starts from changes and suggestions, not from a blank slate.

Every major screen should support this loop.

## Product Design Implications

### Home should answer "why open today?"

The first screen should give users a reason to care right now. Useful examples:

- recent changes since last visit
- skills worth a look
- newly detected drift
- a clean state when nothing needs attention

Home should not become a noisy KPI wall.

### Library should answer "what deserves inspection?"

The library should make it easy to sort and filter by signals that matter:

- multi-source skills
- multi-variant skills
- recently changed skills
- pinned skills
- suggested review targets

### Detail should answer "what is really going on here?"

The skill detail view should make the following legible:

- current description
- variant count
- source distribution
- recent changes
- frontmatter or metadata that affects discovery
- upcoming context or routing hints when available

### Actions should answer "what can I safely do next?"

Every source-level action should be concrete and reversible where possible:

- open directory
- open in editor or IDE
- copy path
- share to another agent
- export ZIP
- convert duplicate real copies to symlinks
- remove one source safely

## Guidance And Onboarding

Skill Grove should not assume that users already understand skill ecosystems well.

The product should gradually teach:

- why variants matter
- why a skill can appear in several places
- why a description is more than documentation
- why one source should often become canonical
- why some future metrics are estimates rather than exact runtime truth

This guidance should appear as lightweight product copy, empty states, and contextual explanations instead of long setup wizards.

## Roadmap Phases

### Phase 1: Earn The Return Visit

Goal: make the app worth reopening even for users who are not actively editing skills that day.

Key directions:

- strengthen Home as a lightweight "what changed and what matters" surface
- improve Worth a Look suggestions
- finish broken symlink and integrity signals
- add first-use guidance that explains Skill, Variant, and Source clearly
- improve empty states so the app teaches the model instead of feeling blank

Success signal:

Users can open Skill Grove after a few days away and immediately understand whether anything needs attention.

### Phase 2: Explain The Library Better

Goal: help users understand not only what files exist, but why a skill may be risky, noisy, or inconsistent.

Key directions:

- description quality hints
- frontmatter and metadata compatibility checks
- long `SKILL.md` and missing-description warnings
- stronger diff and drift entry points for multi-variant skills
- better explanation of symlink and real-source relationships

Success signal:

Users can tell which skill source they should keep editing and which copies are likely just drift.

### Phase 3: Add Context Awareness

Goal: make Skill Grove useful for understanding likely runtime impact, not just local file state.

Key directions:

- estimated catalog or index token cost
- provider capability matrix
- auto-discovery or disable-invocation compatibility hints
- per-agent status for whether a skill is likely auto-discoverable
- top "heavy" skills in the library

Important constraint:

These features must be framed as estimates or provider-specific interpretations, not universal truth.

Success signal:

Users leave with a better intuition for which skills are expensive, discoverable, or likely to route differently across tools.

### Phase 4: Gentle Authoring Support

Goal: help users improve skills without turning Skill Grove into a full IDE.

Key directions:

- suggest better descriptions or structure
- point out obvious anti-patterns
- offer exportable guidance for canonical source hygiene
- consider lightweight templates or lint-style fix suggestions

Important constraint:

Do not jump straight into heavy generation workflows or automatic rewrites. Observation and explanation come first.

Success signal:

Users can improve a skill with confidence while still treating their real source files as the center of truth.

## Near-Term Priorities

The next product decisions should favor these themes:

1. Clarify the product story everywhere.
   README, roadmap, onboarding, and in-app copy should all describe the same value: understanding and tending a personal skill ecosystem.
2. Strengthen revisit behavior.
   "Why open today?" should become a first-class design question.
3. Make hidden mechanics more legible.
   Variants, sources, descriptions, and provider differences should be explained, not just listed.
4. Keep the product local and calm.
   Avoid features that push Skill Grove toward team workflow or marketplace behavior.

## Features We Should Continue To Avoid For Now

- accounts and cloud sync
- team governance workflows
- public skill marketplace mechanics
- aggressive dashboard metrics
- bulk destructive operations
- full skill generation or rewriting as the primary product story

## Decision Filter

Before starting a new feature, ask:

1. Does this help the user understand their skill ecosystem better?
2. Does this give them a clear reason to open or reopen the app?
3. Does this help them make a safer or better source-level decision?
4. Does this preserve the calm, local-first nature of the product?

If the answer to most of these is no, the feature likely belongs later or elsewhere.
