# HIS SQL Assistant

A lightweight SQL assistant for Hospital Information Systems (HIS).

## Project Overview

This project provides a simple development environment with a React frontend and NestJS backend for building a SQL assistant tool targeting HIS databases.

## Requirements

- Node.js >= 20
- npm >= 10
- Git

## Installation

```powershell
# Clone the repository
git clone <repository-url>
cd duan_sqlhis

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Start Backend

```powershell
cd backend
npm run start:dev
```

Backend runs on: **http://localhost:3000**

## Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend runs on: **http://localhost:5173**

## Health API

- **Endpoint**: `GET http://localhost:3000/api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "his-sql-assistant",
    "version": "0.1.0"
  }
  ```

## Project Structure

```
duan_sqlhis/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── main.tsx   # Entry point
│   │   ├── App.tsx    # Main component
│   │   └── index.css  # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend/           # NestJS + TypeScript
│   ├── src/
│   │   ├── main.ts           # Entry point
│   │   ├── app.module.ts     # Root module
│   │   └── health.controller.ts  # Health check endpoint
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── data/              # Database files (ignored by git)
├── .env.example       # Environment variables template
├── .gitignore
└── README.md
```

## Commands

All commands work on Windows PowerShell.

| Command | Description |
|---------|-------------|
| `cd backend && npm run start:dev` | Start backend in development mode |
| `cd backend && npm run build` | Build backend for production |
| `cd backend && npm run start:prod` | Start backend in production mode |
| `cd frontend && npm run dev` | Start frontend development server |
| `cd frontend && npm run build` | Build frontend for production |
| `cd frontend && npm run preview` | Preview production build |