# **App Name**: Pick For Me

## Core Features:

- Today's Task List: Display tasks for the current date, with carryover tasks displayed and able to be added.
- Task Input: Single multiline text input to quickly add tasks with optional shorthand parsing for effort and importance.
- Sorting Modes: Allow users to sort tasks via custom drag-and-drop, effort, and a 'Pick for Me' scoring system based on effort, importance and freshness.
- AI Sorting tool: The LLM acts as a tool that computes 'freshness' by looking at what time tasks have been lingering, 'effort' derived from short usercodes such as 5m/10m/25m/1h and using importance indicators like !! to assist in local sorting based on user state of mind. When LLM cannot derive certain attributes from the prompt, reasonable assumptions shall be made based on implicit information within the prompt, such as the urgency of the work
- Session Controls: Incorporate an 'Energy' picker, to modify the parameters for how tasks are ranked by AI.
- Task Actions: Enable tapping tasks to mark done/undo, inline editing/deletion and carryover tasks can be re-added to current day.
- Data Persistence: Store tasks in Firestore with offline persistence. Create new daily lists, and handle carryover tasks from previous days.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) to evoke calm and focus.
- Background color: Light grey (#F2F4F7), a desaturated version of the primary color, for a gentle, uncluttered feel.
- Accent color: Muted green (#8FCACA), an analogous color, for supportive highlights and CTAs.
- Font: 'PT Sans', a humanist sans-serif font for body text and headlines
- Use simple, line-based icons to represent task categories and actions.
- Employ rounded cards, soft shadows, and generous whitespace to create a friendly and approachable interface.
- Incorporate subtle animations when tasks are marked as complete or when switching between sorting modes.