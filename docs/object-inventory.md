# Object Inventory (OOUX)

## Introduction

This doc is an **Object-Oriented UX** exercise for Giterdun, following Sophia Prater's OOUX methodology. The idea is to identify the app's core **objects** (nouns) before designing screens or features, and map each object's **attributes**, **relationships**, and **CTAs** (verbs the user can perform on it).

This is a **fresh design pass** — it deliberately sets aside the current code and the PRD to rethink the object model from scratch, then compares the result back to what's planned. It is a design artifact, not an implementation spec.

### How it relates to other docs

- **`docs/task_app_prd.md`** — the product requirements doc. Describes features, schema, and status. This inventory sits alongside it and may eventually inform updates to the PRD.
- **Code** — the inventory intentionally ignores the current code. Where the fresh model and the code diverge, that's a design signal to discuss, not a bug.

### Notation key

- **Core content** — what the user sees at a glance
- **Metadata** — background fields (timestamps, IDs, etc.)
- **Attributes** — the object's full property list
- **Relationships** — connections to other objects, with cardinality
- **CTAs** — verbs the user can perform on the object
- Cardinality shorthand:
  - *one* → exactly one, required
  - *many* → zero or more
  - *zero or one* → optional, but at most one

---

## Object Inventory

### 1. Task

> A unit of work the user intends to complete. The central object of the app.

- **Core content**: title, status (done / not done)
- **Metadata**: notes, created-at, completed-at
- **Attributes**:
  - title
  - status (todo / done)
  - effort (XS / S / M / L)
  - notes
  - canvas position *(future)*
- **Relationships**:
  - belongs to one → **Day**
  - belongs to one → **User** (transitively, via Day)
  - has many → **Task** (as subtasks, via parent reference)
  - belongs to zero or one → **Task** (as parent)
  - is focus of zero or one → **Focus Session** *(at a time, future)*
- **CTAs**:
  - create
  - rename
  - mark done / undone
  - delete
  - edit notes
  - set effort
  - add subtask
  - promote subtask to top-level *(future — see Open Q1)*
  - open detail
  - start focus session *(future)*
  - drag on canvas *(future)*

### 2. Day

> A dated container that holds a user's tasks and mood for that calendar day. Users think in "today / yesterday / tomorrow," so Day is a real object — not just a filter.

- **Core content**: date, count of tasks (done / total)
- **Metadata**: —
- **Attributes**:
  - date (YYYY-MM-DD)
  - energy level (low / med / high) *(future)*
- **Relationships**:
  - belongs to one → **User**
  - has many → **Task**
- **CTAs**:
  - view
  - set energy level *(future)*
  - navigate to next / previous day *(future)*

### 3. User

> The person using the app. Owns everything.

- **Core content**: display name
- **Metadata**: email, Google OAuth id, created-at
- **Attributes**:
  - display name
  - email
- **Relationships**:
  - has many → **Day**
  - has many → **Task** (transitively, through Day)
  - has zero or one → **Focus Session** *(at a time, future)*
  - has one → **Canvas** *(future, per-user singleton)*
- **CTAs**:
  - sign in
  - sign out

### 4. Focus Session *(future)*

> A period when the user is actively working on one task, with that task highlighted / elevated above the rest of the list and the app in "active" mode.

This comes from the idea: *"I want a view where the main task is highlighted above others, and an option to click 'start task' to put it in active mode."*

This is a real object — not just UI state — because it has its own attributes (start time, state) and its own CTAs (pause, complete, abandon). Treating it as an object makes it easier to reason about session history, interruptions, and "what happens when I pause."

- **Core content**: the focused task, session state
- **Metadata**: started-at, ended-at
- **Attributes**:
  - state (active / paused / ended)
  - started-at
  - ended-at
- **Relationships**:
  - belongs to one → **User**
  - focuses on one → **Task**
- **CTAs**:
  - start
  - pause
  - resume
  - complete *(also marks the Task done)*
  - abandon *(end without completing the Task)*

### 5. Canvas *(future, single instance per user)*

> A spatial workspace where top-level tasks can be positioned visually. Each user has one persistent canvas.

- **Core content**: the positioned tasks
- **Metadata**: —
- **Attributes**:
  - zoom level
  - pan position
- **Relationships**:
  - belongs to one → **User**
  - has many → **Task** *(positioned, top-level only)*
- **CTAs**:
  - pan
  - zoom
  - drop task (reposition)
  - reset layout

---

## Non-Objects

Things that look like objects in the UI but are really attributes or views.

- **Effort** (XS / S / M / L) — an attribute of Task. It has a bounded domain but no identity of its own, no metadata, and no CTAs you'd take directly on an Effort.
- **Energy Level** (low / med / high) — an attribute of Day. Same reasoning as Effort.
- **Status** (todo / done) — an attribute of Task.
- **Subtask** — **not** a separate object. A subtask is a Task with a `parentTaskId`. Treating subtasks as Tasks makes the future "promote subtask to top-level" action trivial — the data already matches. See Open Q1.
- **List View / Detail Panel** — these are *views*, not objects. They display objects but have no data of their own.

---

## Comparison to PRD & Current Code

This section compares the fresh model against `docs/task_app_prd.md` and the current code.

### What matches
- **Task**, **User**, and **subtasks-as-Tasks** all align with the PRD's data model. The code already stores subtasks as Tasks with `parentTaskId`.

### What this doc promotes to first-class objects that the PRD treats as views or scopes

- **Day** — the PRD treats "daily list" as a scope / query. This doc treats Day as a real object because (a) it owns its own energy level, (b) users talk about "today" as a thing, and (c) the main app view is showing *a Day*, not just a filtered task list. If Day were just a filter, it couldn't own any data of its own.
- **Canvas** — the PRD calls it "Canvas view." This doc treats it as an object with its own attributes (zoom, pan) because view state that persists per user is itself an object.
- **Focus Session** — the PRD has no equivalent. Added based on the "start task / active mode" idea.

### PRD features that are really attributes, not objects

- **Effort** → attribute of Task
- **Energy Level** → attribute of Day
- **Status** → attribute of Task
- **Flag / priority** (removed in v0.1) → would be an attribute of Task
- **Sort modes** → these are view behaviors, not objects

### What's deliberately left out of this doc (deferred)

- **Carryover** — the "tasks from yesterday that didn't get done" concept is being rethought as a staleness / due-date mechanic. Separate design session. Existing code is staying put for now.
- **Recurrence** — deferred entirely.
- **Tags** — too simple for what's wanted. A more sophisticated categorization model is needed (see Open Q2), to be designed separately.

---

## Open Design Questions

### Q1 — Subtask promotion to top-level

The goal is to be able to convert a subtask into a top-level task. Keeping subtasks as Tasks (not a separate object) makes this trivial at the data layer. But the feature raises follow-up questions:

- What happens to the subtask's own subtasks when it's promoted? Do they come with it, get flattened, or get orphaned?
- Does the parent task's subtask list just lose that entry?
- Where does the promoted task land in the Day's task order?

These are feature-level questions, not object-level, but they're worth flagging so the object model holds up.

### Q2 — Categorization system

Tags are off the table. The goal is something more sophisticated for executive-dysfunction-friendly grouping:

- "all kitchen tasks"
- "all phone calls"
- "all errands"
- "all things I can do from the couch"

Possible models to explore later:

- **GTD-style contexts** — tasks have an "@context" like `@phone`, `@home`, `@kitchen`, `@computer`
- **Hierarchical categories** — tree structure (Home > Kitchen > Cleaning)
- **Multi-dimensional tags** — each task has an area + a type + a person
- **Spatial grouping** — group on the canvas, no explicit category object
- **Hybrid** — contexts for "where/how" and spatial groupings for "mental clustering"

Deferred to a separate design session.

### Q3 — Focus Session depth

The Focus Session object is sketched but not fully thought through. Questions for a later pass:

- Can there be only **one** active Focus Session at a time per user?
- Can a session be **paused across days**? (If the user starts a session Sunday night and resumes Monday morning, is it the same session?)
- Is **session history** valuable (stats, insights) or is the session purely ephemeral (lives only while active)?
- Does **completing a session** automatically mark the focused Task done, or should those be separate actions?
- What happens if the user **deletes the focused Task** mid-session?

### Q4 — Energy Level persistence

If the user looks at `Day = last Monday`, is Monday's energy level still there? Probably yes — Day keeps its history, because the whole point of making Day an object is that it has state. Worth being explicit about this so the UI treats past Days as read-only snapshots (with historical energy) vs. today which is editable.

---

## Out-of-Scope Notes

Things mentioned while scoping this doc but explicitly deferred:

- **Staleness / due date mechanic** — replacing the old carryover concept. Separate design session.
- **Categorization system** — replacing tags. Separate design session. See Open Q2.
- **Microanimations / "fidget spinner" feel** — delightful clicks, satisfying button states, tactile interactions. This is styling and interaction design, not object modeling. Out of scope for OOUX — will live in a separate interaction / motion design doc if needed.
- **Recurrence** — deferred entirely. May come back in a later pass.
