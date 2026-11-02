# Asteria Project Hub — Continuous Improvement Prototype

Static prototype for GitHub Pages. Data is currently saved only in each browser via localStorage.

## V1 structure
The Continuous Improvement page is organized by **workstream title** rather than a flat task list. Examples include SOPs, 5S Improvements, and Scrap Reduction.

Each workstream shows:
- Overall completion percentage
- Current step
- Due date
- Number of completed steps
- Owner and email
- Expandable step-by-step progress tracker
- Completed / Current step / Upcoming status
- Subtasks under each step

## Publish on GitHub Pages
1. Create a new GitHub repository (for example `asteria-project-hub`).
2. Upload `index.html`, `styles.css`, and `app.js` to the repository root.
3. In GitHub: Settings → Pages.
4. Under Build and deployment choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. GitHub will provide the public Pages URL.

## Important
This prototype is NOT yet appropriate for confidential project data. The next production step is Microsoft Entra ID authentication plus a shared backend/database with authorization rules.
