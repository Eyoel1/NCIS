# Original User Request

## 2026-09-14T20:09:30Z

<USER_REQUEST>
Build the **NCIS Portal** (National Car Import Supply Chain Management Platform), a high-density, professional web application centralizing Ethiopia's vehicle import lifecycle across 8 stakeholder roles with real-time tracking, document workflows, customs clearance, and simulated external integrations.

Working directory: C:\Users\Ethio\Documents\ncis-portal
Integrity mode: development

Use a full team of agents as requested: "continue as a team".

## Requirements

### R1. Stakeholder Management & Role-Based Dashboards
Implement authentication and role-personalized dashboards for 8 roles: Super Admin, Importer/Overseas Supplier, Shipping Company, Port Operator, Customs Authority, Transport & Freight Forwarder, Financial & Insurance, and Vehicle Registration Office. Provide demo-mode 2FA bypass and a clean, bespoke SVG/CSS logo and logistics SaaS branding (navy/slate blue palette).

### R2. End-to-End Shipment Lifecycle & Real-Time Tracking
Model full vehicle import lifecycles (Pre-Import → Shipping → Port Operations → Customs → Post-Customs → Delivery). Implement an interactive Leaflet map rendering route lines, port congestion heatmaps (Djibouti, Berbera, Modjo/Addis dry ports), public shareable tracking links (`/track/:id`), and unique per-vehicle QR code generation.

### R3. Document Management, OCR Simulation & Customs Processing
Provide digital document upload, version control, e-signatures, and OCR auto-fill simulation for commercial invoices and bills of lading. Implement customs declaration filing, automated duty calculation, exportable formal declaration PDFs, and realistic simulated external service endpoints (Customs, Port, Shipping, Bank, Inspection).

### R4. Workflow Automation, Dispute Resolution & Public Transparency
Automate status transitions, approval chains, and predictive delay risk metrics. Include shipment-scoped stakeholder messaging, a dispute query ticketing system, public transparency statistics (`/statistics`), public landing page (`/`), and an immutable audit trail / chain-of-custody event log.

## Acceptance Criteria

### Platform Completeness & Architecture
- [ ] Separate frontend (`ncis-portal-frontend`: React, Vite, TypeScript, Tailwind CSS, TanStack Query, Leaflet, Recharts) and backend (`ncis-portal-backend`: Node.js, Fastify, TypeScript, Prisma ORM).
- [ ] Automated test suites pass for core backend routes and critical frontend components.
- [ ] All 8 stakeholder role accounts can log in and display their dedicated, personalized dashboard workflows.
- [ ] Public routes (`/`, `/track/:id`, `/statistics`) are fully accessible and interactive without authentication.
- [ ] English and Amharic UI language toggle is operational across primary navigation and forms.

### Data & Simulation Quality
- [ ] Database is seeded with realistic Ethiopian vehicle import data (e.g. Toyota, Hyundai, Isuzu; Djibouti port route; customs assessments).
- [ ] Interactive map displays functional vehicle tracking markers, route paths, and congestion indicators.
- [ ] Customs declaration workflow successfully calculates duties and generates a downloadable PDF declaration.
- [ ] Status updates write verifiable records to the immutable audit log.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-14T17:09:30-03:00.
</ADDITIONAL_METADATA>

## 2026-09-15T03:50:50Z

The user has requested: " let us cancel the testing i will do it manually\. Please cancel any remaining verification agents, skip Milestone 3 automated testing, wrap up immediately, and deliver the final project summary and instructions for running both backend and frontend so the user can test manually.

