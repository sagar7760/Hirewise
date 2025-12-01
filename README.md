<div align="center">
	<img src="client/public/hirewise.svg" alt="HireWise" width="72" />
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
1. Architecture Overview
2. Tech Stack
3. Data Models (Snapshot)
4. Application Flows
5. AI Integration Scope & Design
6. Environment Variables
7. Local Development Setup
8. Deployment

---

## 1. Architecture Overview
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

## 2. Tech Stack
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

## 3. Data Models (Snapshot Highlights)
### User
Roles: `applicant | hr | interviewer | admin`; rich applicant profile sub-document (education, experience entries, skills, projects); interviewer availability; permissions & accountStatus.
### Job
Title, description, department, jobType, location, locationType, salaryRange (supports INR & LPA concept), requiredSkills/preferredSkills, applicationDeadline, defaultInterviewRounds, status, performance indexes & text search.
### Application
Status lifecycle (`submitted`→`under_review`→`shortlisted`→`interview_scheduled`→`interviewed`→`offer_extended`→`offer_accepted` or termination states). AI analysis block with scores, strengths, concerns, recommended questions, extracted document info & metadata, validation, timeline events, notes, interviews linkage, source tracking.
### Notification
Target via user or company+role, stored then optionally emitted to relevant Socket.IO rooms.
### (Others not fully listed here) Interview, Resume, Company: scheduling, artifact management, ownership, branding.

## 4. Application Flows
1. Applicant discovers job → saves or applies.
2. Application chooses profile resume or custom upload.
3. Resume parsed → (optional) AI analysis stored in `application.aiAnalysis`.
4. HR reviews queue: filters by status / score / date.
5. Interviews scheduled (future UI) referencing Interview model; interviewer feedback eventually influences status.
6. Notifications: status changes / interview events dispatched to user & role rooms.

## 5. AI Integration Scope & Design
`geminiService` encapsulates prompt creation and parsing heuristics (regex JSON extraction + fallbacks). All AI calls degrade gracefully: failure returns structured fallback so UI doesn't break. Current prompts include: resume fit analysis, resume info extraction, interview question generation. No automated rejection decisions—AI is advisory.

## 6. Environment Variables
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

## 7. Local Development Setup
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

## 8. Deployment

### Frontend (Vercel)
Configured for Vercel static build (`@vercel/static-build`) using `client/package.json` scripts. All routes are rewired to `index.html` via `vercel.json` fallback for SPA routing.

**Deployment:**
- Push to GitHub repository
- Vercel auto-deploys from `main` branch
- Build command: `npm run build` (in `client/` directory)
- Output directory: `client/dist`

### Backend (Heroku)
Backend is deployed on Heroku with the following configuration:

**Setup:**
1. Heroku uses `Procfile` for process definition: `web: node server.js`
2. Environment variables configured in Heroku dashboard (see section 6)
3. MongoDB Atlas connection via `MONGODB_URI_PROD`
4. CORS configured to allow Vercel frontend origin

**Deployment:**
```bash
# From project root
cd server
git subtree push --prefix server heroku main
# Or use Heroku CLI auto-deploy from GitHub
```

**Requirements:**
- Node.js buildpack enabled
- Environment parity with local `.env`
- MongoDB Atlas whitelist Heroku IP addresses
- Socket.IO configured for production (sticky sessions if multiple dynos)

---

AI is currently used only for <strong>interviewer feedback analysis</strong> (sentiment + summarization). Resume parsing, scoring logic, and other workflow pieces are deterministic / rule‑driven right now with room for future ML extensions.

## Key Marketing Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing / home (not included in this README snapshot) |
| `/how-it-works` | Dual flow explanation (Candidate vs Company) |
| `/features` | Feature grid + AI feedback illustration + roadmap note |
| `/about` | Project philosophy, mission, values, stack, milestones, personal profile, contact CTA |

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
