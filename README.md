# JobTrack

JobTrack is a polished, full-stack personal job application tracker. It gives job seekers one private workspace for companies, applications, interview preparation, and an actionable search dashboard.

## Features

- JWT registration, login, session restoration, and logout
- User-owned companies, applications, and interviews
- Search, pagination, status/company/location/date filters, and allowlisted sorting
- Application detail pages, activity timeline, interview management, confirmation dialogs, loading and error states
- Dashboard totals, pipeline, recent applications, and upcoming interviews
- Responsive React interface designed for desktop, tablet, and mobile

## Tech Stack

React, Vite, React Router, Axios, Context API, Node.js, Express, PostgreSQL, `pg`, JWT, bcryptjs, and modern CSS.

## Architecture

`client/` contains the Vite UI, API client, context, pages, and reusable components. `server/src/` separates routes, controllers, services, middleware, configuration, utilities, and database setup. The API never accepts a frontend-provided `user_id`; ownership comes from the verified JWT.

## Database Schema

| Table | Purpose |
| --- | --- |
| `users` | Accounts, unique email, bcrypt password hash, timestamps |
| `companies` | User-owned company directory |
| `applications` | User-owned applications and job-search metadata |
| `interviews` | Interviews belonging to applications |

Foreign keys enforce ownership relationships. User deletion cascades to companies and applications; application deletion cascades to interviews. PostgreSQL checks constrain statuses, interview types/results, and indexes support common lookup paths.

## API Endpoints

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Applications | `GET/POST /api/applications`, `GET/PUT/DELETE /api/applications/:id` |
| Companies | `GET/POST /api/companies`, `GET/PUT/DELETE /api/companies/:id` |
| Interviews | `GET/POST /api/interviews`, `GET/PUT/DELETE /api/interviews/:id` |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/dashboard/recent` |

`GET /api/applications` accepts `page`, `limit`, `search`, `status`, `companyId`, `location`, `fromDate`, `toDate`, `sort`, and `order`.

## Authentication and Security

Passwords are bcrypt-hashed and never returned. Protected endpoints require `Authorization: Bearer <token>`. SQL uses parameterized queries; IDs, URLs, dates, enums, pagination, and user input are validated. API errors have a consistent JSON shape. Configure a restrictive `CORS_ORIGIN` in deployment.

## Local Development

Prerequisites: Node.js 20+, npm, and PostgreSQL 14+.

```sql
CREATE USER jobtrack_user WITH PASSWORD 'change_me';
CREATE DATABASE jobtrack OWNER jobtrack_user;
```

Copy `.env.example` to `.env` in this directory:

```env
DATABASE_URL=postgresql://jobtrack_user:change_me@localhost:5432/jobtrack
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Initialize and run the backend:

```bash
cd server
npm install
npm run db:init
npm run dev
```

Run the frontend in another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:5000/api` in `client/.env` (see `client/.env.example`).

## Deployment

Deploy `client/` to Vercel (build command `npm run build`, output `dist`) and set `VITE_API_URL` to the deployed API URL. Deploy `server/` to Render or Railway with `npm start`, a hosted PostgreSQL `DATABASE_URL`, a strong `JWT_SECRET`, and `CORS_ORIGIN` set to the deployed frontend URL. Run `npm run db:init` once against the hosted database.

## Screenshots

Add product screenshots here when publishing the portfolio.

## Future Improvements

Email reminders, saved views, application import/export, document attachments, analytics history, and automated job-board import.
