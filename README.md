<div align="center">
	<img src="/public/hirewise.svg" alt="HireWise" width="72" />
	<h1>HireWise – Frontend</h1>
	<p><strong>Smarter hiring with AI. Faster, fairer, better.</strong></p>
	<sup>Built with React 19, Vite 7, Tailwind CSS 4, React Router 7</sup>
</div>

## Overview
<div align="center">
	<h1>HireWise</h1>
	<p><strong>Modern, AI‑assisted hiring & application platform</strong></p>
	<p>
		Applicant experience • Structured pipelines • Role‑aware dashboards • Real‑time notifications • Resume parsing & AI screening assistance
	</p>
	<sup>Currently focused AI scope: <em>resume parsing & interview / application feedback analysis (Gemini)</em></sup>
</div>

---

## Table of Contents
1. Vision & Philosophy
2. Core Feature Set
3. Architecture Overview
4. Tech Stack
5. Data Models (Snapshot)
6. Application Flows
7. AI Integration Scope & Design
8. Security & Compliance Considerations
9. Environment Variables
10. Local Development Setup
11. NPM Scripts Reference
12. Testing Strategy (Planned / Partial)
13. Folder Structure
14. Deployment (Vercel + Node API)
15. Roadmap & Milestones
16. Contribution Guidelines
17. License
18. Contact

---

## 1. Vision & Philosophy
HireWise aims to simplify and humanize the hiring lifecycle while keeping it structured, measurable, and fair:
* Transparency: Applicants always see where they stand.
* Fair Hiring: Standardized stages & structured feedback reduce bias.
* Responsible AI: AI is assistive (summaries, analysis), not an opaque decision engine.
* Fast Feedback Loops: Real‑time notifications, score breakdowns, and timeline events.

## 2. Core Feature Set
Current (implemented or partially implemented):
* Multi‑role platform: applicant, HR, interviewer, admin.
* Role‑aware protected routes (React Router v7).
* Applicant job discovery, application submission (profile or custom resume).
* Resume upload + parsing (PDF / DOCX) via `pdf-parse`, `mammoth`, custom extraction.
* AI assistance (Gemini) for: resume fit analysis, recommended interview questions, key strengths/gaps extraction, structured JSON parsing attempts with graceful fallback.
* Application pipeline tracking: statuses, timeline events, interview linkage.
* Real‑time notifications (Socket.IO) + persisted Notification model.
* Saved jobs + metadata timestamps.
* HR management: job postings, default interview rounds scaffolding (in progress), application review, candidate scoring fields (AI analysis fields on Application model).
* Interviewer modular profile (availability, expertise, preferences) for scheduling foundations.
* Admin company/user oversight (initial scaffolding for organization endpoints).
* Dark / light theme, responsive UI, marketing pages (How It Works, Features, About) using Tailwind.

Planned / Emerging:
* Interview scheduling orchestration UI.
* Rich feedback capture & aggregation.
* Offer workflow & acceptance tracking.
* Analytics dashboards (conversion, funnel leaks, time‑to‑hire metrics).

## 3. Architecture Overview
Monorepo style (frontend + backend) without a shared package layer yet.

High Level:
```
┌──────────────────┐      REST + JSON      ┌────────────────────┐
│ React SPA (Vite) │  <------------------> │  Node/Express API  │
│ Auth + Routing   │                      │  (Role/Resource)   │
└────────┬─────────┘                      └─────────┬──────────┘
				 │  Socket.IO (notifications)                │
				 ▼                                           ▼
	 Real-time events                           MongoDB (Models)
																								│
																								▼
																		 AI (Gemini) assist layer
```

Key Back-End Layers:
* Entry: `server/server.js` sets middleware (helmet, rate limiting, cors, morgan) & mounts route modules.
* Persistence: Mongoose models (User, Job, Application, Interview, Notification, Resume, Company) with indexing & virtuals.
* Services: `geminiService` (AI), `notificationService` (persistence + emit), `documentParser` (resume extraction; PDF/DOCX).
* Middleware: auth (JWT), upload (multer), error handler, rate limiting & security headers.
* Realtime: Socket.IO (room model: `user:{id}`, `company:{companyId}:{role}`) for targeted notifications.

Frontend Layers:
* React 19 + React Router 7 nested route structure.
* Contexts: Auth, Theme, Notifications, Toast.
* Hooks: `useApiRequest`, `useHRApplications` (data fetch / caching logic patterns).
* UI: Tailwind utility classes + custom animation triggers (IntersectionObserver + CSS classes).

## 4. Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| Backend | Node.js (>=16), Express 4, Mongoose 7 |
| Database | MongoDB |
| Auth | JWT (stateless) |
| Real-Time | Socket.IO 4 |
| AI | Google Generative AI (Gemini 1.5 Flash) |
| Parsing | pdf-parse, mammoth (DOCX), custom extraction logic |
| Security | helmet, express-rate-limit, CORS configured origin |
| Dev Tooling | nodemon, jest (initial), supertest (planned), ESLint 9 |

## 5. Data Models (Snapshot Highlights)
### User
Roles: `applicant | hr | interviewer | admin`; rich applicant profile sub-document (education, experience entries, skills, projects); interviewer availability; permissions & accountStatus.
### Job
Title, description, department, jobType, location, locationType, salaryRange (supports INR & LPA concept), requiredSkills/preferredSkills, applicationDeadline, defaultInterviewRounds, status, performance indexes & text search.
### Application
Status lifecycle (`submitted`→`under_review`→`shortlisted`→`interview_scheduled`→`interviewed`→`offer_extended`→`offer_accepted` or termination states). AI analysis block with scores, strengths, concerns, recommended questions, extracted document info & metadata, validation, timeline events, notes, interviews linkage, source tracking.
### Notification
Target via user or company+role, stored then optionally emitted to relevant Socket.IO rooms.
### (Others not fully listed here) Interview, Resume, Company: scheduling, artifact management, ownership, branding.

## 6. Application Flows
1. Applicant discovers job → saves or applies.
2. Application chooses profile resume or custom upload.
3. Resume parsed → (optional) AI analysis stored in `application.aiAnalysis`.
4. HR reviews queue: filters by status / score / date.
5. Interviews scheduled (future UI) referencing Interview model; interviewer feedback eventually influences status.
6. Notifications: status changes / interview events dispatched to user & role rooms.

## 7. AI Integration Scope & Design
`geminiService` encapsulates prompt creation and parsing heuristics (regex JSON extraction + fallbacks). All AI calls degrade gracefully: failure returns structured fallback so UI doesn’t break. Current prompts include: resume fit analysis, resume info extraction, interview question generation. No automated rejection decisions—AI is advisory.

## 8. Security & Compliance Considerations
Implemented:
* HTTP security headers (helmet).
* Rate limiting (env configurable window/max).
* JWT verification for protected resources & Socket.IO auth hook.
* Environment‑based Mongo URI selection (dev vs prod).
* Input validation (express-validator present in deps; usage to be expanded).
Planned:
* Centralized permission middleware (fine‑grained resource checks).
* Audit logs for admin actions.
* Password hashing (bcryptjs) – ensure salt rounds documented (not shown in snippet; add in auth controller logic).
* Enhanced validation & sanitization on file uploads.

## 9. Environment Variables
Create a `.env` inside `server/` (never commit) with:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hirewise
# Production override
MONGODB_URI_PROD=
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
GEMINI_API_KEY=your_gemini_key_here
```

Optional / Future:
```
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
```

## 10. Local Development Setup
Prereqs: Node 18+ recommended (>=16), MongoDB running locally, npm.

Clone & install:
```bash
git clone <repo-url>
cd HireWise
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Create `server/.env` (see section 9).

Run backend:
```bash
cd server
npm run dev
```
Server boots: http://localhost:5000 (health: /api/health)

Run frontend (in new terminal):
```bash
cd client
npm run dev
```
Vite dev URL (default): http://localhost:5173

Visit the SPA; API requests target `http://localhost:5000/api/*`.

## 11. NPM Scripts Reference
Backend (`server/package.json`):
* `dev` – nodemon watch server.
* `start` – production start.
* `test` – run jest test suite (placeholder, minimal coverage yet).
* `test:parser` – run document parser standalone.
* `test:setup` – environment variable diagnostic.
* `test:backend` – backend implementation quick checks.
* `test:api` – API endpoint smoke tests.

Frontend (`client/package.json`):
* `dev` – Vite dev server.
* `build` – production build (outputs to `client/dist`).
* `preview` – locally preview built assets.
* `lint` – ESLint over sources.

Root: (no orchestrating scripts yet) – consider adding workspaces in future.

## 12. Testing Strategy (Current / Planned)
Current: Ad-hoc scripts in `server/test-files/` plus preliminary jest config. Models & controllers lack unit test coverage.
Planned:
* Unit tests: model validation & service logic (geminiService parse fallbacks, notification service emission logic with mocked IO).
* Integration tests: auth flow, application submission, AI analysis fallback.
* E2E (future): Playwright/Cypress for applicant funnel & HR review workflow.
* Performance snapshots: indexing & query latency on Application & Job collections.

## 13. Folder Structure (Trimmed)
```
HireWise/
	client/                 # React SPA
		src/
			components/
			contexts/           # AuthContext, ThemeContext, NotificationsContext, ToastContext
			pages/               # marketing + role pages
			hooks/
			utils/
		public/
		vite.config.js
	server/                 # Express API
		config/
		controllers/
		middleware/
		models/
		routes/
		services/
		uploads/
		tests/ (placeholder)
	vercel.json             # Static frontend deployment config
```

## 14. Deployment
Frontend: Configured for Vercel static build (`@vercel/static-build`) using `client/package.json` scripts; all routes rewired to `index.html` via `vercel.json` fallback.

Backend: Run separately (e.g. Render, Railway, Fly.io, or traditional VPS). Need environment parity (`.env`). CORS must allow deployed frontend origin. Consider creating a Procfile / Dockerfile (not yet present) for reproducible deploy.

Edge / Future:
* Potential merge into a single container with reverse proxy.
* Add CI (GitHub Actions) for lint + test + build checks.

## 15. Roadmap & Milestones
Completed / Initial:
* Marketing pages (How It Works, Features, About) & branding.
* Resume parsing pipeline.
* AI resume analysis + question generation (Gemini) with robust fallback.
* Multi-role data model foundations & status timeline.
* Real-time notification infrastructure (persistence + Socket.IO emit).

Upcoming (Prioritized):
1. Interview scheduling layer (availability + slot booking UI).
2. Interviewer feedback capture & aggregation UI.
3. Offer management workflow (statuses + e-sign placeholder).
4. Advanced search & filtering (composite indexes + text scoring exposure).
5. Candidate analytics dashboards.
6. Accessibility & SEO enhancements (ARIA timeline, skip link, structured data JSON-LD).
7. Comprehensive test suite & CI pipeline.
8. Email delivery integration (transactional notifications).
9. Role-based permissions middleware refactor & policy docs.
10. Infrastructure as Code & containerization.

Stretch Ideas:
* Skill taxonomy & auto-tagging.
* Candidate anonymization mode for unbiased screening.
* Multi-tenant isolated data clusters or row-level security patterns.

## 16. Contribution Guidelines
1. Fork & branch naming: `feat/<area>-short-desc` or `fix/<issue>`.
2. Run `npm run lint` (frontend) before commits; add a backend lint step (TBD).
3. Keep PRs small & focused; include screenshots for UI changes.
4. Do not commit `.env` or uploaded assets with PII.
5. For AI prompt changes, document rationale in PR description.
6. Add/extend tests when touching core models or services.

## 17. License
MIT (see `LICENSE` once added). Add license file if absent.

## 18. Contact
Built by Sagar Soradi – Full‑Stack Developer (MERN / .NET)

Email: sagarsoradi011@gmail.com
LinkedIn: https://www.linkedin.com/in/sagar-soradi
GitHub: https://github.com/sagar7760

---
If you discover an issue or have a feature idea, open an issue or start a discussion. Feedback is highly appreciated.

AI is currently used only for <strong>interviewer feedback analysis</strong> (sentiment + summarization). Resume parsing, scoring logic, and other workflow pieces are deterministic / rule‑driven right now with room for future ML extensions.

## Key Marketing Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing / home (not included in this README snapshot) |
| `/how-it-works` | Dual flow explanation (Candidate vs Company) |
| `/features` | Feature grid + AI feedback illustration + roadmap note |
| `/about` | Project philosophy, mission, values, stack, milestones, personal profile, contact CTA |

## Authenticated Areas (High-Level)
- Applicant: browse jobs, apply, track applications, saved jobs, notifications.
- HR: manage jobs, applications, interviews, notifications, profile.
- Admin: organization setup, HR & interviewer management, jobs, notifications.
- Interviewer: upcoming interviews, pending feedback, notifications, profile.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 7 |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS 4 utilities + custom animation classes |
| State | React Context (Auth, Theme, Notifications, Toast) |
| Auth | JWT (frontend consumption) |
| Build | Vite dev server + HMR |

## Frontend Features
- Responsive marketing pages (desktop-first layout with mobile stacking)
- Reusable fade / scale animation classes via IntersectionObserver
- Dark / light theme toggle (context + Tailwind dark classes)
- Accessible semantic headings and alt text
- Modular page structure: `pages/global` (public) vs role-based segments
- Hero section with feature mini-cards (About page)
- Footer + Navbar dynamically updated as pages evolved

## Folder Structure (Client Only)
```
client/
	src/
		assets/                # Images / SVGs
		components/
			common/              # Navbar, Footer, shared UI
			layout/              # Layout wrappers
			interviewer/         # Role-specific UI pieces
		contexts/              # Auth, Theme, Toast, Notifications providers
		hooks/                 # Custom hooks (API wrapper, data fetching)
		pages/
			global/              # Public marketing pages (Home, HowItWorks, Features, About)
			applicant/           # Applicant dashboard pages
			hr/                  # HR pages
			admin/               # Admin pages
			interviewer/         # Interviewer pages
		utils/                 # Helper utilities / debugging
		main.jsx               # App bootstrap
		App.jsx                # Route definitions
```

## Running the Frontend
From repository root (or `client/` directory):

```bash
cd client
npm install
npm run dev
```
Default Vite dev server URL: http://localhost:5173 (adjust based on your config / port collisions).

## Environment Variables (Example)
Create a `.env` in `client/` if needed:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

The code uses a custom `useApiRequest` hook—ensure the base URL matches the backend server.

## Theming & Animations
- Dark mode toggled via ThemeContext; root element toggles `dark` class.
- Animations: Elements with `fade-up`, `fade-left`, `fade-right`, `scale-in` become visible when intersecting viewport.

## Accessibility Considerations
- Descriptive alt text for images (e.g., AI illustration, portrait placeholder replaced with real photo).
- Logical heading hierarchy (H1 only per page root hero).
- Focus states rely on browser + Tailwind defaults (customization TBD).

## Current Limitations / Roadmap
| Area | Status | Notes |
|------|--------|-------|
| AI Usage | Partial | Only interviewer feedback analysis currently uses AI (sentiment + summary). |
| Resume Parsing UI | Implemented | Driven by backend parser; UI surfaces structured data. |
| Bias Metrics | Planned | Future idea: expose anonymized scoring diffs / fairness indicators. |
| SEO Meta | Pending | Add meta tags + JSON-LD for marketing pages. |
| Accessibility Enhancements | Pending | Skip links, ARIA landmarks, improved keyboard outlines. |
| Testing | Partial | No comprehensive frontend test suite included yet. |

## Contributing (Internal / Early Stage)
1. Branch from `main`.
2. Use conventional, descriptive commit messages.
3. Keep marketing page components lean—push shared styling into utility classes when duplication grows.
4. Open a PR; include before/after screenshots for UI changes.

## Design Principles
- Fairness & transparency first.
- Minimalism over visual clutter.
- Progressive enhancement: content readable even without animations.
- Clear separation between public marketing surface and authenticated app.

## Contact
- Author: Sagar Soradi
- LinkedIn: https://www.linkedin.com/in/sagar-soradi
- GitHub: https://github.com/sagar7760
- Email: <sagarsoradi011@gmail.com>

If the mailto link doesn’t open a composer in your browser, configure a default mail handler or copy the email above.

---
_This README reflects the state after adding How It Works, Features, About pages, footer/nav refinements, and accessibility-ready layout patterns._
