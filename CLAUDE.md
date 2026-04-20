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

**giterdun** is a Next.js 15 app with Firebase backend. Two main views live in `src/app/page.tsx`:
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
| `use-firestore-tasks.ts` | Task CRUD; loads today + yesterday's carryovers; optimistic local state |
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

### Canvas / Pan-Zoom (`CanvasView.tsx` + `ProjectCard.tsx`)

- Panzoom attaches to `surfaceRef` (the transformable layer). Cards are absolutely positioned inside it.
- **Event conflict:** Panzoom captures native DOM events at the element level, before React's synthetic events. To prevent panzoom from interfering with card interactions:
  - `onPointerBegin` is called on card mousedown/touchstart → immediately calls `panzoomRef.current.pause()`
  - `onPointerFinish` is called on mouseup/touchend → calls `panzoomRef.current.resume()`
- `ProjectDrawerDesktop` is rendered **outside** the canvas container with `position: fixed` so it isn't affected by panzoom transforms.
- Button clicks on cards work via `stopPropagation()` on `onMouseDown`/`onTouchStart` (prevents the card's drag handler from firing) plus `touchAction: 'manipulation'` on the button element.

### Styling

Tailwind with CSS variable–based theming (`--background`, `--primary`, etc. as HSL values). Dark mode is class-based. Font classes: `font-body`, `font-headline`, `font-code`.

### Key Utilities

- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `getToday(date?)`
- `src/lib/grocery-classifier.ts` — `classifyItem(title)` → `'grocery' | 'other'` using keyword matching
