# Task App – Product Requirements Document

## Overview

A calm, minimal task management app designed to help users focus on what to work on today.

Users add tasks for the day, optionally estimate effort, and work through their list at their own pace.

The app has two primary interfaces:

- **List View** – daily task list; the main interface for adding, completing, and managing tasks.
- **Canvas View** – displays top-level tasks spatially so users can visually organize larger areas of work. *(planned)*

Each user has their own private task data.

---

# Users

The system supports user accounts via Google OAuth (Firebase Authentication).

Each user has their own dataset. Tasks belong to a single user and cannot be accessed by other users.

There is no collaboration or shared data in the MVP.

---

# Core Object

## Task

Tasks are the primary object in the system. A task represents a single unit of work for a given day.

Tasks may contain subtasks recursively *(subtasks planned, not yet implemented)*.

A task can represent:

- a single action
- a larger effort
- a container for subtasks

---

# Task Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | unique task id |
| userId | string | owner of the task |
| title | string | task title |
| description | string? | optional notes |
| status | `todo` \| `done` | completion status |
| effort | `XS` \| `S` \| `M` \| `L` \| null | estimated effort |
| effortSource | `ai` \| `user` \| null | who set the effort |
| effortConfidence | number? | AI confidence score |
| effortReasons | string[]? | AI reasoning for effort estimate |
| listDate | string (YYYY-MM-DD) | the day this task belongs to |
| isCarryover | boolean | carried over from a previous day |
| originDate | string? | original date if carried over |
| parentTaskId | string? | parent task id (nullable) — for subtasks |
| depth | number? | nesting level |
| order | number? | ordering among sibling tasks |
| canvasPositionX | number? | x coordinate for canvas view |
| canvasPositionY | number? | y coordinate for canvas view |
| createdAt | number | timestamp (ms) |
| completedAt | number? | timestamp when marked done |
| deletedAt | number? | soft delete timestamp |

### Effort Values

| Value | Meaning |
|-------|---------|
| XS | ~5 minutes |
| S | ~10 minutes |
| M | ~25 minutes |
| L | ~1 hour |

Effort can be set manually by the user or automatically classified by AI when a task is created.

---

# Core Features (Current)

## Daily Task List

Tasks are scoped to a specific date (`listDate`). On load the app shows today's tasks.

Users can:

- add a task (with optional inline effort shorthand: `5m` → XS, `10m` → S, `25m` → M, `1h` → L)
- edit task title
- edit task description (via detail panel)
- set effort (XS / S / M / L)
- flag a task as priority
- mark task complete / incomplete
- delete a task
- open task detail panel

## Task Detail Panel

Clicking a task opens a detail panel showing full task information.

- **Desktop:** right sidebar panel alongside the task list
- **Mobile:** bottom sheet that slides up from the bottom

The panel supports:

- editing title inline
- editing notes (description)
- setting effort
- toggling flag
- toggling completion status

## Carryover Tasks

Tasks from the previous day that were not completed appear in a "Carryover" section.

Users can add individual carryover tasks to today's list.

## AI Effort Classification

When a new task is created without an explicit effort tag, the app sends the task title to Claude (Haiku) to classify effort automatically.

Classification happens asynchronously and does not block task creation.

`effortSource` is set to `"ai"` when classified automatically, `"user"` when set manually.

---

# Views

## List View

Primary interface. Shows today's tasks in the order they were created.

## Task Detail Panel

Accessible from any task in the list. Implemented as:

- desktop: right sidebar (320px), list shifts to two-column layout
- mobile: fixed bottom sheet with drag handle and backdrop

## Canvas View

Displays projects as draggable cards on a freeform canvas.

Projects are spatial workspaces for organizing larger bodies of work. Each project has:
- A title
- Free-form description and notes
- Attached links
- Attached to-do items (either nested tasks or references to the main task list)

Capabilities:
- create, edit, and delete projects
- add / edit description, links, and attached to-dos
- drag cards to reposition
- pan and zoom the canvas
- clicking a card opens the project detail panel

Subtasks do not appear on the canvas.

---

# Architecture

**Frontend**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI component primitives

**Backend**
- Firebase Firestore (real-time database, offline persistence)
- Firebase Authentication (Google OAuth)
- Next.js Server Actions (AI classification)
- Anthropic Claude API (effort classification + sort scoring)

**Hosting**
- Vercel

**Data structure**

```
users/{uid}/lists/{YYYY-MM-DD}/tasks/{taskId}
```

All task queries are scoped by `userId` via Firestore security rules.

---

# Non-Goals for MVP

- moving tasks between parents
- recurring tasks
- calendar integration
- push notifications
- collaboration / shared tasks
- tagging or filtering
- file attachments
- subtasks *(schema supports it, UI not yet built)*

---

# Future Features

- subtask UI (nested list, expand/collapse)
- moving tasks between parents
- canvas view
- recurring tasks
- calendar integration
- task filtering and tagging
- collaboration
- canvas improvements (grouping, zooming)

---

# Implementation Status

| Feature | Status |
|---------|--------|
| Google auth | ✅ done |
| Daily task list | ✅ done |
| Task CRUD | ✅ done |
| Effort field (XS/S/M/L) | ✅ done |
| AI effort classification | ✅ done |
| Flag / priority | ✅ done |
| Carryover tasks | ✅ done |
| Task detail panel (desktop + mobile) | ✅ done |
| Canvas view (basic) | ✅ done |
| Canvas: create/delete projects | ✅ done |
| Canvas: drag/pan/zoom | ✅ done |
| Canvas: project info button | ✅ done |
| Subtask UI | ⬜ planned |
| Project detail panel (description, links, attached to-dos) | ⬜ planned |

---

# Removed Features

These were designed and partially built but cut from the product.

| Feature | Why Removed |
|---------|-------------|
| **Sort modes** (Easy First, Custom, AI-ranked) | Removed from UI — task order is now fixed to creation order |
| **Energy level selector** (low / med / high) | Tied to AI sort; removed along with sorting |
| **AI-recommended next task** | First task was highlighted in "Giterdun" sort mode; no longer applicable without sort |
