## Helpful note

If setup fails or the app does not run correctly, stop and ask for help before continuing so the environment is fixed before new work begins.

# Frontend Onboarding

Welcome to the project. This guide will help you set up the frontend locally and follow the team workflow.

## 1. Install required tools

If you run into issues while installing tools or cloning the repo, contact Gavin or ask someone for help.

- Install Git: https://git-scm.com/downloads
- Install Node.js LTS: https://nodejs.org/en/download

## 2. Check the installation

Open a terminal such as Command Prompt or PowerShell and run:

```bash
git --version
node --version
npm --version
```

If all three commands return versions, the environment is ready.

## 3. Clone the repository

Choose an empty folder and run:

```bash
git clone https://github.com/Resume-Parser-Organization/project-frontend.git
cd project-frontend
```

## 4. Install dependencies

From the project folder, run:

```bash
npm install
```

## 5. Start the frontend locally

To launch the local dev server:

```bash
npm run dev
```

This starts the Vite development server so you can view the app in the browser.

## 6. Working on a feature

Before starting new work, follow this process:

```bash
git checkout main
git pull
```

Create a branch for your task:

```bash
git checkout -b feature/dropdown-component
```
name your feature. For example 'dropdown-component' is the 
name of the new branch

When your work is ready:

```bash
git add .
git commit -m "Add dropdown component for resume category filter"
git push -u origin feature/dropdown-component
```

If you are using VsCode or an editor with plugins, please install 
Prettier: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
