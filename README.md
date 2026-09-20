# Disaster Management System

## Quick Start (Local Development)

1. **Install Dependencies:**
   `npm run install:all`

2. **Environment Variables:**
   - Copy `backend/.env.example` to `backend/.env` and add your MongoDB Atlas connection string.
   - Copy `frontend/.env.example` to `frontend/.env`.

3. **Seed Database:**
   Create the default admin account: `npm run seed:admin`
   Generate demo disaster reports: `npm run seed:demo`

4. **Start Development Servers:**
   Terminal 1: `npm run dev:backend`
   Terminal 2: `npm run dev:frontend`
