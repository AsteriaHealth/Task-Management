# Asteria Continuous Improvement Hub

A lightweight, GitHub Pages-ready task and project board for the Continuous Improvement department.

## What this version includes
- Project-board view inspired by Microsoft Lists / SharePoint board layouts
- Projects as horizontal buckets / columns
- Tasks as cards inside each project
- Task status, owner, email, due date, notes and subtasks
- Side-panel task editing (no browser prompt boxes)
- New Project, New Task and New Workspace forms with Cancel, X, Escape and backdrop-close behavior
- Board, Overview and My Work views
- Search and status filtering
- Collapsible project columns
- Local browser saving for prototype use
- CSV export structured for later Microsoft Lists / SharePoint import
- JSON backup export

## Publish on GitHub Pages
1. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the root of your GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select **main** and **/(root)**, then save.

## Important prototype limitation
This version saves data in the browser using `localStorage`. It is useful for testing the workflow, but it is **not yet a shared multi-user database**. Do not use confidential production data until Microsoft sign-in and a shared backend are connected.

## SharePoint / Microsoft Lists path
Use **Export → CSV for SharePoint**. The CSV contains workspace, project, task, owner, email, status, due date, notes and subtask information in a flat format suitable for import/mapping into Microsoft Lists.

For a true shared department task manager, the next version should connect Microsoft Entra ID authentication and either Microsoft Lists / SharePoint or a shared database.
