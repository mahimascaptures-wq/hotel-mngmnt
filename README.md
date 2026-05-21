# MediCare — Hospital Management System

A full-stack hospital management system covering patients, doctors, departments, appointments, medical records, prescriptions, and billing.

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, role-based access
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts

## Project structure

```
Hospital-mgmnt-sys/
├── backend/        # Express REST API
└── frontend/       # Next.js 14 dashboard
```

## Features

- **Roles:** Admin, Doctor, Receptionist, Patient — each with tailored navigation and permissions
- **Auth:** JWT-based login / register, password hashing with bcrypt
- **Patients:** Full CRUD with demographics, vitals, allergies, chronic conditions
- **Doctors:** Profiles, specializations, qualifications, fees, departments
- **Departments:** CRUD with head doctor assignment
- **Appointments:** Book / reschedule / cancel, status filters, role-scoped lists
- **Medical Records:** Diagnosis, symptoms, treatment, vitals tracking
- **Prescriptions:** Multi-medication entries with dosage, frequency, duration
- **Invoices:** Auto totals, tax, discount, status tracking, payment methods
- **Dashboard:** Live counts, appointment trends, revenue trends, status pie chart
- **Beautiful UI:** Modern Tailwind components, responsive layout, sidebar + topbar, modals, charts, badges

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (default `mongodb://127.0.0.1:27017`) — or a MongoDB Atlas connection string

> Don't have MongoDB locally? Install [MongoDB Community](https://www.mongodb.com/try/download/community) or sign up for free at [MongoDB Atlas](https://www.mongodb.com/atlas) and use the Atlas connection string in `backend/.env`.

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env        # On Windows: copy .env.example .env
npm install
npm run seed                # Creates demo data + accounts
npm run dev                 # Starts API on http://localhost:5000
```

### 2. Frontend

In a separate terminal:

```bash
cd frontend
cp .env.local.example .env.local   # On Windows: copy .env.local.example .env.local
npm install
npm run dev                        # Starts on http://localhost:3000
```

Open <http://localhost:3000> and sign in.

---

## Demo Accounts (seeded)

| Role         | Email                    | Password      |
| ------------ | ------------------------ | ------------- |
| Admin        | `admin@hospital.com`     | `admin123`    |
| Doctor       | `aisha@hospital.com`     | `doctor123`   |
| Receptionist | `reception@hospital.com` | `reception123`|
| Patient      | `john@example.com`       | `patient123`  |

Additional doctors / patients are seeded — see `backend/src/utils/seed.js`.

---

## Environment Variables

### `backend/.env`

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/hospital_mgmt
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

### `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## API Overview

Base URL: `http://localhost:5000/api`

| Resource       | Endpoints |
| -------------- | --------- |
| Auth           | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users          | `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id` |
| Patients       | `GET/POST /patients`, `GET/PUT/DELETE /patients/:id` |
| Doctors        | `GET/POST /doctors`, `GET/PUT/DELETE /doctors/:id` |
| Departments    | `GET/POST /departments`, `GET/PUT/DELETE /departments/:id` |
| Appointments   | `GET/POST /appointments`, `GET/PUT/DELETE /appointments/:id` |
| Medical Records| `GET/POST /records`, `GET/PUT/DELETE /records/:id` |
| Prescriptions  | `GET/POST /prescriptions`, `GET/PUT/DELETE /prescriptions/:id` |
| Invoices       | `GET/POST /invoices`, `GET/PUT/DELETE /invoices/:id` |
| Dashboard      | `GET /dashboard` |

All endpoints (except `/auth/*`) require an `Authorization: Bearer <token>` header.

---

## NPM Scripts

### Backend

- `npm run dev` — Run API with nodemon
- `npm start` — Run API in production mode
- `npm run seed` — Reset DB and seed demo data

### Frontend

- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm start` — Run production build
- `npm run lint` — Lint with Next.js ESLint config

---

## Tech Stack

**Backend**
- express, mongoose, bcryptjs, jsonwebtoken
- express-async-handler, cors, morgan, dotenv

**Frontend**
- next 14, react 18, typescript 5
- tailwindcss 3, lucide-react, recharts
- axios, date-fns, clsx, tailwind-merge, react-hot-toast

---

## Roadmap Ideas

- File uploads for medical record attachments
- Email / SMS notifications for appointments
- Doctor calendar with drag-and-drop scheduling
- PDF export for invoices and prescriptions
- Multi-tenant hospital support

---

Built with care. PRs welcome.
