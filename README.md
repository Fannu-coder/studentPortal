# GRONIXE Student Portal

The first milestone for a MERN student portal: a responsive student discovery experience, sample learning roadmap, role-based sign-in screen, and Express/MongoDB authentication foundation.

## Requirements

- Node.js 20 or later
- MongoDB running locally or a MongoDB connection string

## Start locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a running MongoDB database. Local default: `mongodb://127.0.0.1:27017/student-portal`.
2. Replace `JWT_SECRET` with a private random value at least 32 characters long. Keep `.env` out of source control. The API refuses to start with a missing, short, or example JWT secret.
3. Install packages with `pnpm install` (or `npm install`).
4. Run `pnpm dev` (or `npm run dev`). The API waits for MongoDB before it starts listening; it exits with a clear error if the connection cannot be established. The Vite app runs on port 5173 and proxies `/api` requests to the Express API on port 5000.

Build the frontend with `pnpm build` (or `npm run build`).

## Vercel preparation

This repository is configured for Vercel’s Express deployment shape: the root `index.js` exports the Express app, and `pnpm build` places the Vite output in `public/` for static delivery. MongoDB connections are cached and reused between warm function requests. The deployment has not been published.

For a personal, non-commercial demo on Vercel Hobby, configure `MONGODB_URI` with a hosted MongoDB connection string and `JWT_SECRET` with a private random value of at least 32 characters in Vercel’s project environment variables. Do not use the local `127.0.0.1` database URI in the hosted environment. Seed the hosted database and create an admin account only after its environment variables are configured. The Atlas Free cluster is capped at 512 MB and does not include automated backups; export important data separately.

Vercel Hobby is restricted to personal, non-commercial use. Recheck current Vercel and MongoDB terms and usage limits before deployment; hosted services can change their free allowances.

Populate MongoDB with the four starter learning paths using `pnpm seed:careers` (or `npm run seed:careers`). The seed is idempotent and only inserts missing paths; edit or replace those sample records as project content is finalized.

Seed three example projects and two example competitions with `pnpm seed:opportunities` (or `npm run seed:opportunities`). Competition dates are sample values calculated when the records are first inserted.

### Create the first admin account

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a private `ADMIN_PASSWORD` of at least 12 characters in `.env`, then run `pnpm create:admin` (or `npm run create:admin`). The command creates an active admin account once, hashes the password, and refuses to overwrite an existing account. It never prints the password. Remove these three values from `.env` after provisioning. Student and mentor accounts are created by mentors and admins inside the portal.

## Authentication

`POST /api/auth/login` accepts `{ "email", "password", "role" }` for an existing student, mentor, or admin account. The API checks the account role and active status, compares a bcrypt password hash, and returns a signed seven-day token. `GET /api/auth/me` returns the signed-in account. `requireAuth` and `requireRole` middleware are available to protect future API routes.

Sign-in is limited to 30 requests per network address per 15 minutes, and contact submissions to 8 per hour. Counters are shared through MongoDB across API instances, store a keyed hash instead of the raw client address, and expire automatically. If the API runs behind a trusted reverse proxy, set `TRUST_PROXY_HOPS` to the exact number of proxy hops so Express can identify client addresses correctly; leave it at `0` for direct local access.

This milestone does not include account registration or a seed account. Accounts must be provisioned through a controlled process before sign-in can succeed. The starter learning paths are sample content; admin management screens will be added in a later milestone.

Career paths are stored in MongoDB and exposed through `GET /api/careers` and `GET /api/careers/:slug`. If the database has not been seeded or the API is unavailable, the student pages use the bundled sample content.

Admins can manage paths from `/admin/careers`. The admin API at `/api/admin/careers` requires a valid admin account and supports listing, creating, editing, publishing or hiding, and deleting paths with their phases and resources. Resource URLs must use `http://` or `https://`.

Admins manage student-facing project and competition listings at `/admin/opportunities`. The protected API under `/api/admin/opportunities` supports creating, editing, publishing or hiding, and deleting both types of listing. The project and competition seed command supplies starter records if needed.

Students can browse `/projects` and `/competitions` after sign-in and send an interest request with contact email, skills, and a short motivation. Requests are scoped to the signed-in student and cannot be duplicated for the same opportunity. Admins can review submissions at `/admin/applicants` and mark them selected or declined. The starter admin inbox does not send email; admins can contact applicants using the submitted email address.

Students can check request statuses on `/my-applications`; results are loaded from the signed-in student’s enrollment records.

Mentors use `/mentor` to register students, record payment details, and add subscription periods. Newly created students receive a random temporary password and must set a private password at first sign-in. The mentor must share the temporary password with the student privately; the portal does not send invitations. Payment entries are records only and do not process transactions. Use only amount, currency, payment method, date, optional receipt reference, and notes; never enter card numbers or online banking credentials.

Admins can review mentor-entered payment and subscription history at `/admin/mentor-records`. Mentor APIs scope roster and record changes to the students created by that mentor. Subscription plan names and date ranges are recorded as entered; the portal does not calculate prices, collect payments, or assume a renewal interval.

Admins manage mentor accounts at `/admin/mentors`, including profile edits and activation status. Newly created mentors receive a temporary password once and must replace it at first sign-in. Deactivating an account immediately prevents new authenticated API requests. Admins can search student accounts, reset a student password, and activate or deactivate access at `/admin/students`; password resets show a temporary password once and require the student to change it at sign-in. The list shows each student’s mentor when one created the account.

Visitors and signed-in users can send a message from `/contact`. Contact messages are stored in MongoDB for admins to review at `/admin/contact`, where the team can reply by email and mark messages resolved. This inbox does not send automatic email replies.

After admin sign-in, `/admin` is the overview page with active account and content counts, recent enrollment requests, and shortcuts to the management workspaces.
