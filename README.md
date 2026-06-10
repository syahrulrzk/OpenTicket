# ITSM & Helpdesk Platform

A production-ready **IT Service Management (ITSM) & Helpdesk Platform** built with modern technologies.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS + Shadcn/UI |
| Backend | NestJS v10 + TypeScript + Prisma v5 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Auth | JWT + OTP (TOTP) |
| Queue | BullMQ |
| Monitoring | Prometheus + Grafana |
| Infra | Docker Compose + Nginx |

## Project Structure

```
itsm-platform/
├── apps/
│   ├── frontend/          # React + Vite SPA
│   └── backend/           # NestJS API
├── infra/                 # Docker, Nginx, Prometheus, Grafana
├── .github/workflows/     # CI/CD pipelines
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure variables
3. Start infrastructure services:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
4. Install backend dependencies:
   ```bash
   cd apps/backend && npm install
   ```
5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
6. Start backend:
   ```bash
   npm run start:dev
   ```
7. Install frontend dependencies:
   ```bash
   cd apps/frontend && npm install
   ```
8. Start frontend:
   ```bash
   npm run dev
   ```
9. Access the app at `http://localhost:5173`

### API Documentation

Swagger docs available at `http://localhost:3000/api/docs` when backend is running.

## Features

- 🎫 **Ticket Management** — Create, assign, track, and resolve support tickets
- 👥 **User Management** — Role-based access control (Super Admin, IT Manager, IT Support, User)
- 🖥️ **Asset Management** — Track servers, network devices, software licenses
- 📚 **Knowledge Base** — Articles, categories, full-text search
- 📊 **Reports & Analytics** — Monthly reports, SLA compliance, engineer performance
- 🔔 **Notifications** — Real-time via WebSocket, email via SMTP
- 🔐 **Security** — JWT with refresh tokens, MFA (TOTP), rate limiting, audit logging
- 📈 **Monitoring** — Prometheus metrics, Grafana dashboards
- 🐳 **Containerized** — Docker Compose for dev & production
- 🔄 **CI/CD** — GitHub Actions for testing, building, and deployment

## License

MIT