
# Task App – Product Requirements Document

## Overview

This application is a task management system built around hierarchical tasks.

Users organize work as **tasks and subtasks**. A larger effort is represented as a task containing subtasks.

The application has two primary interfaces:

- **List View** – used to manage and complete tasks.
- **Canvas View** – displays top-level tasks spatially so users can visually organize areas of work.

Each user has their own private task data.

---

# Users

The system supports user accounts.

Each user has their own dataset.

Tasks belong to a single user and cannot be accessed by other users.

There is no collaboration or shared data in the MVP.

---

# Core Object

## Task

Tasks are the only object type in the system.

Tasks may contain subtasks recursively.

A task can represent:

- a single action
- a larger effort
- a container for subtasks

---

# Task Schema

| Field | Description |
|------|-------------|
| id | unique task id |
| userId | owner of the task |
| title | task title |
| description | optional task description |
| status | todo or done |
| parentTaskId | parent task id (nullable) |
| depth | nesting level |
| order | ordering among sibling tasks |
| size | optional effort estimate |
| canvasPositionX | x coordinate for top-level tasks |
| canvasPositionY | y coordinate for top-level tasks |
| createdAt | timestamp |
| updatedAt | timestamp |
| deletedAt | nullable soft delete timestamp |

### Field Rules

Top-level tasks:

parentTaskId = null  
depth = 0

Subtasks:

parentTaskId = id  
depth >= 1

Canvas positions apply only to top-level tasks.

---

# Core Features (MVP)

Users can:

- create task
- create subtask
- edit task title
- edit task description
- mark task complete
- delete task
- open task detail

Deleting a task deletes its subtasks.

Moving tasks between parents is **not supported in the MVP**.

---

# Views

## List View

Primary interface for task management.

Displays tasks as a nested hierarchy.

Capabilities:

- display nested tasks
- expand and collapse subtasks
- create tasks
- create subtasks
- edit tasks
- complete tasks
- delete tasks

---

## Canvas View

Displays tasks where:

parentTaskId = null

Each top-level task appears as a draggable card.

Capabilities:

- drag cards to reposition tasks
- pan the canvas
- zoom the canvas
- cards may overlap

Subtasks do not appear on the canvas.

Clicking a card opens the task detail view.

---

# Task Detail View

Opening a task shows:

- title
- description
- subtasks

Users can:

- edit title
- edit description
- add subtasks
- complete subtasks
- delete subtasks

The detail view may be implemented as a drawer or modal.

---

# Task Size Field

Tasks include an optional field:

size

Possible values:

tiny  
small  
medium  
large

This field represents estimated effort.

The MVP does **not automatically compute task size**.

Future versions may populate this field using an LLM.

Task creation must not depend on AI services.

---

# Architecture

Frontend
- React
- TypeScript

Backend
- API routes

Database
- persistent database storing users and tasks

Hosting
- Vercel

All task queries must be scoped by:

task.userId

---

# Non-Goals for MVP

Do not implement:

- moving tasks between parents
- recurring tasks
- calendar integration
- notifications
- collaboration
- tagging
- filtering
- attachments
- AI task planning
- mobile-specific UI

---

# Future Features

Possible future features include:

- moving tasks between parents
- recurring tasks
- calendar integration
- LLM-based task size estimation
- task filtering
- tagging
- collaboration
- canvas improvements

---

# Implementation Order

1. user authentication
2. task database schema
3. task CRUD API
4. nested list UI
5. task detail view
6. canvas rendering for top-level tasks
7. card dragging
8. canvas pan and zoom
9. data persistence
