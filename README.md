# 🇪🇹 NCIS Portal — National Car Import Supply Chain Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Fastify](https://img.shields.io/badge/Fastify-4-000000?style=flat&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

> **NCIS Portal** is a high-density, centralized supply chain management platform designed for Ethiopia's vehicle import lifecycle. It seamlessly orchestrates operations across **8 institutional stakeholder roles** — connecting maritime arrivals, border crossings, dry ports, customs clearance, duty payments, and final vehicle plate registration.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Stakeholder Roles & Dashboards](#-stakeholder-roles--dashboards)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Ethiopian Customs Duty Engine](#-ethiopian-customs-duty-engine)
- [Public Portal & Tracking](#-public-portal--tracking)
- [Demo Credentials](#-demo-credentials)
- [API Overview](#-api-overview)
- [License](#-license)

---

## 🌍 Overview

Importing vehicles into landlocked Ethiopia requires coordinating across maritime ports (Djibouti, Berbera), international transport corridors, Ethiopian Customs Commission (ECC) checkpoints, dry port terminals (Modjo, Kality), commercial banks, and regional transport bureaus.

The **NCIS Portal** replaces fragmented paperwork with an end-to-end digital lifecycle:
1. **Pre-Import**: Importer declaration, commercial invoice, bill of lading (B/L) OCR extraction.
2. **Shipping & Transit**: Maritime tracking into Port of Djibouti / Port of Berbera.
3. **Port Operations**: Vessel discharge, gate-in/out, container dwell time analytics.
4. **Customs & Duty**: Automated Ethiopian tariff computation under **Proclamation No. 1186/2020**, automated risk channeling (Green / Yellow / Red), Form C-30 generation.
5. **Finance & Release**: Bank clearance, customs release order issuance.
6. **Inland Transport & Registration**: GPS transit tracking, dry port arrival, regional plate issuance, and digital registration.

---

## ✨ Key Features

- **🗺️ Interactive Corridor Tracking Map**: Live Leaflet map displaying multimodal trade corridors (Djibouti $\rightarrow$ Galafi $\rightarrow$ Semera $\rightarrow$ Modjo $\rightarrow$ Addis Ababa; Berbera $\rightarrow$ Togochale $\rightarrow$ Dire Dawa). Visualizes live vessel & container locations, waypoint checkpoints, and real-time port congestion heatmaps.
- **🧮 Ethiopian Customs Duty Calculator**: Full implementation of statutory tax calculation:
  - Customs Duty (up to 35%)
  - Excise Tax according to engine CC & vehicle type (**Proclamation No. 1186/2020**)
  - Value Added Tax (VAT 15%)
  - Sur-Tax (10%)
  - Withholding Tax (3%)
- **📄 Form C-30 PDF Generation & Channel Assessment**: Instant generation and export of Ethiopian Customs Single Goods Declaration (Form C-30) with channel routing tags (Green, Yellow, Red) and risk scoring.
- **📱 Unique Vehicle QR Code Passports**: Generates verifiable QR codes per vehicle / shipment for border officials, traffic police, and registration verification.
- **🔍 Document OCR Simulation**: Simulated optical character recognition parsing VIN, engine size, CIF value, consignee, and carrier details directly into declaration forms.
- **🌐 Public Transparency & Verification**:
  - **Public Tracking Portal** (`/track/:id`): Real-time tracking without login for consumers and cargo owners.
  - **National Transparency Dashboard** (`/statistics`): Real-time metrics on cleared vehicles, average dwell times, revenue generated, and port efficiency.
- **🔒 Immutable Audit Trail**: Cryptographically traceable event log recording every status change, inspection result, and release authorization.
- **🌐 Bilingual Localization**: One-click toggle between **English** and **Amharic (አማርኛ)** across navigation, metrics, and forms.
- **🌓 Light & Dark Theme**: Full custom design system supporting both Light mode (default) and high-density Dark mode with seamless transition.

---

## 👥 Stakeholder Roles & Dashboards

The portal provides 8 tailored dashboards with dedicated workflow tools:

| Role | Dashboard URL | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | `/dashboard/admin` | Platform oversight, user management, audit trails, system health |
| **Importer / Supplier** | `/dashboard/importer` | Shipment registration, document upload, OCR ingestion, duty estimation |
| **Shipping Line** | `/dashboard/shipping` | Vessel manifests, voyage status, ETA updates, container tracking |
| **Port Operator** | `/dashboard/port` | Djibouti/Berbera/Modjo gate passes, dwell monitoring, yard management |
| **Customs Authority** | `/dashboard/customs-authority` | Declaration review, channel assignment (G/Y/R), duty assessment, Form C-30 |
| **Freight Forwarder** | `/dashboard/transport` | Multimodal dispatch, corridor checkpoint clearance, fleet tracking |
| **Financial / Bank** | `/dashboard/finance` | Duty escrow payments, letter of credit (L/C) verification, bank release |
| **Vehicle Registration** | `/dashboard/registration` | VIN validation, road safety certification, plate allocation (ET-Code 2/3) |

---

## 🏗️ System Architecture

The NCIS Portal is built as a modern decoupled full-stack architecture:

```
ncis-portal/
├── ncis-portal-frontend/     # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Header, CorridorMap, Modals, Badges, OCR, QR
│   │   ├── context/          # AuthContext, ThemeContext, LanguageContext
│   │   ├── locales/          # English (en.ts) and Amharic (am.ts) translations
│   │   ├── pages/            # Dashboards, Landing, Public Tracker, Statistics
│   │   ├── services/         # API client, duty calculator, mock datasets
│   │   └── types/            # TypeScript domain models
└── ncis-portal-backend/      # Fastify + TypeScript + Prisma ORM + SQLite
    ├── prisma/
    │   ├── schema.prisma     # Relational database schema
    │   └── seed.ts           # Comprehensive Ethiopian demo seed data
    └── src/
        ├── routes/           # REST endpoints for shipments, customs, audit, etc.
        ├── services/         # Business logic, duty engine, QR/OCR handlers
        └── plugins/          # Fastify JWT auth, Prisma client
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd ncis-portal-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run Prisma migrations & generate Prisma client
npx prisma generate
npx prisma db push

# Seed the database with realistic Ethiopian vehicle & port data
npm run db:seed

# Start backend development server (runs on port 4000)
npm run dev
```

The backend will start at `http://localhost:4000`. You can verify it by opening:
- `http://localhost:4000/api/public/statistics`

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd ncis-portal-frontend

# Install dependencies
npm install

# Start Vite development server (runs on port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧮 Ethiopian Customs Duty Engine

The built-in duty calculation engine adheres to Ethiopian Customs Commission regulations and **Excise Tax Proclamation No. 1186/2020**:

$$\text{Customs Duty} = \text{CIF Value} \times \text{Duty Rate (35\%)}$$
$$\text{Excise Tax} = (\text{CIF} + \text{Duty}) \times \text{Excise Rate (0\%--100\% depending on CC/type)}$$
$$\text{VAT} = (\text{CIF} + \text{Duty} + \text{Excise}) \times 15\%$$
$$\text{Sur-Tax} = (\text{CIF} + \text{Duty} + \text{Excise}) \times 10\%$$
$$\text{Withholding Tax} = \text{CIF} \times 3\%$$
$$\text{Total Payable} = \text{Duty} + \text{Excise} + \text{VAT} + \text{Sur-Tax} + \text{Withholding}$$

---

## 🔎 Public Portal & Tracking

- **Landing Page**: `http://localhost:5173/`
- **Public Vehicle Tracking**: `http://localhost:5173/track/ET-SHP-2026-001`
- **National Statistics Dashboard**: `http://localhost:5173/statistics`

---

## 🔑 Demo Credentials

To explore all 8 stakeholder workflows easily, use the **Quick Switch** selector in the top-right header or log in with any of the following demo profiles (2FA is automatically set to bypass in demo mode):

| Stakeholder Role | Demo Email | Organization |
| :--- | :--- | :--- |
| **Super Admin** | `admin@ncis.gov.et` | Ministry of Transport & Logistics (MTL) |
| **Importer** | `importer@ethioimports.com` | Addis Car Importers PLC |
| **Shipping Line** | `agent@maersk-djibouti.com` | Maersk Line Horn of Africa |
| **Port Operator** | `ops@portdjibouti.com` | Port de Djibouti S.A. |
| **Customs Authority** | `customs@ecc.gov.et` | Ethiopian Customs Commission (ECC) |
| **Freight Forwarder** | `dispatch@transethiopia.com` | Trans-Ethiopia Logistics |
| **Financial / Bank** | `trade@cbe.com.et` | Commercial Bank of Ethiopia (CBE) |
| **Vehicle Registration**| `register@fta.gov.et` | Federal Transport Authority (FTA) |

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/statistics` | High-level national import statistics |
| `GET` | `/api/public/track/:query` | Track shipment by tracking number or VIN |
| `GET` | `/api/shipments` | List all shipments with full relations |
| `GET` | `/api/shipments/:id` | Detailed shipment records and audit events |
| `POST` | `/api/customs/assess` | Run risk assessment and assign channel |
| `POST` | `/api/documents/ocr` | Simulated OCR document data extraction |
| `GET` | `/api/audit-logs` | Immutable audit trail of system events |

---

## 📄 License

This project was developed for the **Ethiopian National Car Import Supply Chain Modernization Initiative**.
Released under the [MIT License](LICENSE).