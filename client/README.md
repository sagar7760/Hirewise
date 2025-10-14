<div align="center">
	<img src="/public/hirewise.svg" alt="HireWise" width="72" />
	<h1>HireWise – Frontend</h1>
	<p><strong>Smarter hiring with AI. Faster, fairer, better.</strong></p>
	<sup>Built with React 19, Vite 7, Tailwind CSS 4, React Router 7</sup>
</div>

## Overview
HireWise is a recruitment platform focused on fair, structured, and efficient hiring. The frontend delivers a marketing layer (How It Works, Features, About) plus the authenticated application dashboards for applicants, HR, admins, and interviewers.

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
