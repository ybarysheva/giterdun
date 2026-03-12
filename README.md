# Pick For Me - Project PRD & Specs

"Pick For Me" is a calm, minimal to-do app designed for focus and reducing decision fatigue, particularly helpful for users with ADHD.

## 🚀 Core Features

### 1. The "Pick for Me" Algorithm
The heart of the app is a sorting mode that uses four factors to decide what you should do next:
- **Importance**: Flagged tasks are weighted heavily (45%).
- **Effort/Ease**: Based on the effort bucket (35%).
- **Staleness**: Tasks carried over for 2+ days get a priority nudge (20%).
- **Energy Fit**: Adjusts priority based on your current session energy (Low, Med, High).

### 2. AI Effort Estimator (Genkit)
- **Automatic Classification**: For any task without a manually set effort, the AI classifies it into:
    - **XS**: < 5m (Quick actions, messages).
    - **S**: 5–15m (Simple chores, scheduling).
    - **M**: 15–45m (Focused work, research).
    - **L**: 45m+ (Substantial projects, errands).
- **Confidence UI**: Displays an outlined badge if the AI is uncertain (< 60% confidence).
- **Reasoning**: The AI provides 1-3 brief phrases explaining why it chose that effort level.

### 3. Daily Workflow
- **Today-Only Focus**: The UI clears every day, focusing only on current tasks.
- **Carryover List**: Unfinished tasks from yesterday appear in a dedicated section to be re-added or dismissed.

## 🛠 Technical Stack
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, Lucide Icons.
- **UI System**: ShadCN UI (Radix-based).
- **Backend**: Firebase (Firestore, Auth).
- **AI**: Genkit 1.x with Google Gemini (gemini-2.5-flash).
- **Deployment**: Firebase App Hosting.

## 📊 Data Schema (Firestore)
- `/users/{userId}/lists/{YYYY-MM-DD}`
    - `tasks`: Array of Task objects.
    - `date`: String.

## 💡 Ideas & Specs Discussed
- **Deterministic AI**: Using low temperature (0.2) for stable effort estimation.
- **Non-Blocking Persistence**: AI updates are handled via non-blocking Firestore calls to keep the UI snappy.
- **Debug Panel**: Integrated directly into the main page to monitor scoring logic and AI raw outputs.
- **Energy Levels**: Real-time adjustment of priorities based on user's subjective energy state.

## 🎨 Style Guidelines
- **Primary**: #A0D2EB (Soft Blue)
- **Background**: #F2F4F7 (Light Grey)
- **Accent**: #8FCACA (Muted Green)
- **Font**: Inter Tight (Sans-serif)