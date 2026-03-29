# LipaTrust: Programmable Trust for the Digital Economy

> **"Money in Motion" 

[![LipaTrust Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://lipatrustapp.netlify.app/) 
[![Repository](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/G-alileo/lipa_trust_system)

## Problem Statement
In many crowdfunding and peer-to-peer payment scenarios in Kenya, there is a significant "trust gap." Donors and contributors often worry about whether their funds are reaching the intended recipient or if the campaign is legitimate. Existing platforms often lack automated verification and transparency for small-to-medium scale fundraisers.

## The Solution: LipaTrust
LipaTrust is a **Programmable Trust** platform that bridges this gap using M-Pesa's robust infrastructure. We provide a guided product flow where:
- **Campaigns are Verified**: Admins audit and verify Paybill/Till numbers before campaigns go live.
- **Automated Disbursement**: Funds are settled directly to verified business numbers.
- **Transparent Tracking**: Real-time progress bars and ledger entries for every contribution.
- **Integrity First**: If a campaign is rejected after contributions begin, refunds are automatically queued.

---

## Key Features
- **Public Campaign Discovery**: Search and support verified causes.
- **M-Pesa STK Push Integration**: One-click contributions directly from your mobile phone.
- **Unified Auth Flow**: Seamless transition between supporting and creating campaigns.
- **Admin Audit Dashboard**: Robust tools for platform integrity and campaign verification.
- **Offline Resilience**: Payment requests are queued locally if the connection is lost and synced when back online.

---

## Tools & Technologies
- **Frontend**: React (Vite), Vanilla CSS (Custom Design System), React Router.
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Uvicorn.
- **Database**: MySQL 8.0.
- **Integrations**: Safaricom Daraja API (M-Pesa), JWT Authentication.
- **DevOps**: `uv` for Python package management, `npm` for frontend.

---

## Meet the Team
| Name | Role | GitHub |
| :--- | :--- | :--- |
| **Jamespeter Murithi** | Lead Architect / Backend | [@G-alileo](https://github.com/G-alileo) |
| **Meshack Bahati** | Backend Engineer | [@meshackbahati](https://github.com/meshackbahati) |
| **Mark Waweru** | UI/UX Designer | [@Allghosted](https://github.com/Allghosted) |
| **Anne Irene Wanjiru** | Frontend Developer | [@ViraSheik](https://github.com/ViraSheik) |
| **Francis Mwangi** | QA & Integration | [@254francis](https://github.com/254francis) |

---

## About the System
LipaTrust is designed to be "human-first." We've removed technical complexity so that users can focus on their goals—whether that's raising money for a medical bill, a school project, or a community initiative. The system architecture emphasizes **idempotency** (to prevent double-payments) and **row-level locking** (to ensure financial consistency).

### Technical Flow
1. **Discovery**: Users discover campaigns on the landing page.
2. **Commitment**: Contributor initiates STK Push via M-Pesa.
3. **Verification**: Daraja API sends a callback to our backend; we update the campaign ledger.
4. **Disbursement**: Admin verifies the goal achievement and triggers fund release to the campaign's Paybill.

---

## Setup & Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8+

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your M-Pesa Sandbox credentials in .env
uv venv
source .venv/bin/activate # or .venv\Scripts\activate on Windows
uv sync
uv run python create_tables.py
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd ui
npm install
npm run dev
```



---
*Developed for the Safaricom x GOMYCODE Kenya #MoneyInMotion Hackathon 2026.*
