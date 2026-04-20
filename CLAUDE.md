# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (sets NODE_ENV=production)
npm run typecheck    # TypeScript check without emitting
npm run lint         # ESLint
```

No test suite is configured. There is no Firebase emulator setup — all development hits the real Firebase backend.

## Architecture Overview

**Giterdun** is a Next.js 15 app with Firebase backend. Two main views live in `src/app/page.tsx`:
- **List view** — daily tasks, carryovers, subtasks, shopping list
- **Canvas view** — pan/zoom project board (`CanvasView.tsx` + panzoom library)

### Firebase Layer (`src/firebase/`)

- `config.ts` + `index.ts` — Firebase singleton init with IndexedDB offline persistence
- `provider.tsx` — `FirebaseProvider` context; `client-provider.tsx` wraps app with an `AuthGate` that renders `LoginScreen` until Google sign-in completes
- **Non-blocking writes** — All Firestore mutations use helpers in `non-blocking-updates.tsx` (`setDocumentNonBlocking`, `updateDocumentNonBlocking`, etc.) so the UI never waits on Firestore. Errors emit via `error-emitter.ts` and surface as toasts through `FirebaseErrorListener.tsx`
- `errors.ts` — `FirestorePermissionError` with structured context for debugging security rule failures

### Firestore Structure

```
/users/{userId}/
  lists/{YYYY-MM-DD}          # tasks array for a given day
  shopping/list               # shopping items array
  projects/{projectId}        # canvas project cards
```

Security rules in `firestore.rules` enforce strict user-ownership via path (`/users/{userId}/*`).

### Hooks (`src/hooks/`)

| Hook | Responsibility |
|------|---------------|
| `use-firestore-tasks.ts` | Task CRUD; loads today's tasks + all historical incomplete tasks as carryovers; optimistic local state |
| `use-tasks-manager.ts` | Wraps above; adds `getSubtasksForTask()`, exposes `firstTask` |
| `use-shopping-list.ts` | Shopping CRUD; auto-classifies items via `grocery-classifier.ts`; done items auto-delete after 3s |
| `use-projects.ts` | Real-time Firestore listener; position saves are debounced 500ms |
| `use-mobile.tsx` | `useIsMobile()` — viewport < 768px |
| `use-toast.ts` | Reducer-based toast state, max 1 visible, 100s TTL |

### Data Types (`src/lib/types.ts`)

```ts
Task: { id, title, status: 'todo'|'done', listDate: 'YYYY-MM-DD', isCarryover,
        parentTaskId?, depth?, effort?: 'XS'|'S'|'M'|'L', createdAt, completedAt? }
ShoppingItem: { id, title, done, category?: 'grocery'|'other', createdAt }
Project: { id, name, canvasPositionX, canvasPositionY, createdAt }
```

### Component Patterns

- **Responsive pair pattern:** Most panels exist as two components — a mobile bottom sheet (e.g., `TaskDetailPanel`) and a desktop sidebar (`TaskDetailPanelDesktop`). Both render from the same parent state but use `md:hidden` / `hidden md:flex` to show the right one.
- **Shared content:** Both variants call a shared inner component (e.g., `DrawerContent`) to avoid duplication.
- All UI primitives in `src/components/ui/` are Radix UI + Tailwind (shadcn/ui pattern).

### Styling

Tailwind with CSS variable–based theming (`--background`, `--primary`, etc. as HSL values). Dark mode is class-based. Font classes: `font-body`, `font-headline`, `font-code`.

### Key Utilities

- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `getToday(date?)`
- `src/lib/grocery-classifier.ts` — `classifyItem(title)` → `'grocery' | 'other'` using keyword matching

---

## Active Work & Handoff

### Current Focus: Canvas View Mobile Interactions

The canvas view has a fundamental event conflict between the **panzoom library** and **React's synthetic event system**. Panzoom attaches listeners at the native DOM level on `surfaceRef`, which means it captures touch/mouse events before React handlers fire. This has caused persistent issues with:

1. Card dragging on mobile
2. The info button (ⓘ) opening the project detail panel on mobile

#### What's Working
- **Desktop:** Card dragging works. Info button opens the panel.
- **Mobile:** Canvas pan/zoom works. Card dragging with long-press (500ms hold → vibrate → drag) is implemented but **untested on real device with latest code**.
- **Info button on mobile:** Currently broken — panel does not open.

#### The Core Panzoom Problem

Panzoom intercepts all touch events on its surface element. `stopPropagation()` on React synthetic events does **not** stop panzoom because panzoom uses native DOM listeners. Attempts tried:
- `preventDefault()` on touchstart — blocked by browser passive listener restriction
- Window-level capture listeners with `stopPropagation()` — broke card dragging
- `panzoom.on('beforeMouseDown')` with `e.preventDefault()` — works for mouse only, no equivalent for touch

#### Current Approach (in code now)

`CanvasView.tsx` passes `onPointerBegin` / `onPointerFinish` to each `ProjectCard`:
- `onPointerBegin` → `panzoomRef.current.pause()` — called immediately on card mousedown/touchstart
- `onPointerFinish` → `panzoomRef.current.resume()` — called on mouseup/touchend

This works for card dragging because the card's `handleTouchStart` fires first (card is the event target, fires before bubbling to panzoom's surfaceRef), pausing panzoom before it can pan.

**The unsolved problem:** The info button's `onTouchStart` was calling `e.stopPropagation()` to prevent card drag from starting, but this also prevented `onPointerBegin` from firing, so panzoom was never paused and swallowed the tap. The latest fix removes `stopPropagation` from the button's touch handler so the event bubbles to the card → pauses panzoom → tap completes → onClick fires. This is untested on device as of handoff.

#### Relevant Files

| File | Role |
|------|------|
| `src/components/app/CanvasView.tsx` | Panzoom init, pause/resume callbacks, drawer rendering |
| `src/components/app/ProjectCard.tsx` | Card drag logic, long-press for mobile, info button |
| `src/components/app/ProjectDrawer.tsx` | `ProjectDrawer` (mobile sheet, `md:hidden`) + `ProjectDrawerDesktop` (`hidden md:flex fixed`) |

#### Key Implementation Details

- `ProjectDrawerDesktop` uses `position: fixed` and is rendered **outside** the canvas `<div>` (in a React Fragment) so panzoom transforms don't affect it.
- `ProjectDrawer` (mobile bottom sheet) stays inside the canvas div but uses `fixed` positioning via Tailwind.
- Cards have `data-project-card` attribute for identification.
- Long-press threshold: `LONG_PRESS_MS = 500` in `ProjectCard.tsx`.
- Drag threshold: `DRAG_THRESHOLD = 5px`.

#### Next Steps / Things to Try if Button Still Broken

If removing `stopPropagation` from the button's touch handler doesn't fix it, the next approaches to consider:

1. **Rethink the button entirely** — replace the `<button>` with a tap zone that uses native touch events registered with `{ passive: false }` so `preventDefault()` is allowed, giving full control over event handling.
2. **Use a portal** — render the info button outside the panzoom surface entirely (as a fixed overlay positioned to match the card) so panzoom never sees its events.
3. **Switch panzoom libraries** — `@panzoom/panzoom` (different from the current `panzoom` package) has an `excludeClass` option that natively ignores touches on marked elements.
