# Student Registration & Academic Management Portal

A production-grade architectural scaffold for a national-scale student registration,
admissions, and results portal (SSC/UPSC/NTA/CBSE/university-style).

## What this is

A real, working **foundation**: correct database design, core backend modules with
actual security/business logic, a multi-step frontend registration flow, Docker/CI-CD
setup, and full documentation for the parts not fully coded out.

## What this is not

A complete, tested, 100-module implementation generated in one pass. A system meant to
serve millions of students — with every screen, every admin workflow, every edge case,
load-tested and security-audited — is realistically weeks-to-months of team engineering
work, not a single response. Treat this as the scaffold you'd hand to a team on day one,
not a finished product to deploy Friday afternoon.

## What's implemented with real logic

| Area | Files |
|---|---|
| Database schema (all entities from spec) | `backend/prisma/schema.prisma` |
| Auth: JWT + rotating refresh tokens + Argon2id + account lockout + multi-device sessions | `backend/src/auth/auth.service.ts` |
| OTP: hashed, expiring, attempt-limited | `backend/src/auth/otp.service.ts` |
| RBAC | `backend/src/common/guards/roles.guard.ts`, `.../decorators/roles.decorator.ts` |
| Photo/signature validation (dimensions, size, MIME, checksum, AI-advisory quality flags) | `backend/src/documents/image-validation.service.ts`, `documents.controller.ts` |
| Fee payments (UPI/card/net banking via gateway pattern, server-side amount resolution, signature-verified callbacks) | `backend/src/payments/payments.service.ts` |
| Admit cards (signed QR + barcode, PDF generation) | `backend/src/admit-cards/admit-cards.service.ts` |
| Results (bulk import, explicit publish step, withhold) | `backend/src/results/results.service.ts` |
| Audit trail (append-only, before/after state on every mutation) | `backend/src/audit/audit.service.ts` |
| Data retention & archival cron job | `backend/src/common/retention.job.ts` |
| Security headers/CSP/CORS/rate-limit bootstrap | `backend/src/main.ts` |
| Multi-step registration wizard w/ progress bar, i18n, draft-save | `frontend/components/RegistrationWizard.tsx` |
| Live camera photo capture + crop + client pre-validation | `frontend/components/steps/PhotoCaptureField.tsx` |
| Docker (multi-stage, non-root, healthchecked) | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| CI/CD (lint, typecheck, test, dependency + Trivy scan, build, deploy) | `.github/workflows/ci-cd.yml` |

## What's documented but not fully coded (by design — these are genuinely large subsystems)

- Admin panel UI (student list/verification queue/analytics dashboard screens)
- Public marketing pages (Home/About/Courses/Blogs/Gallery/etc.)
- Exam-center allotment algorithm (capacity-aware assignment logic)
- Full document-type controllers (category certificate, domicile certificate, ID proofs) — these follow the exact same pattern as `documents.controller.ts`, just with different `DocumentType` enum values and no image-dimension checks
- AV/malware scanning integration (ClamAV or cloud AV — integration point marked in code)
- Production face-detection provider wiring (integration point marked in `image-validation.service.ts`)
- Full test suites (unit/integration/e2e/load)
- WCAG 2.2 AA audit (the wizard uses semantic roles/`aria-*` attributes as a starting point — a full audit needs a screen-reader pass and axe-core CI gate)

## Docs

- [`docs/ER-DIAGRAM.md`](docs/ER-DIAGRAM.md) — entity relationships and design rationale
- [`docs/SECURITY.md`](docs/SECURITY.md) — full security architecture
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — setup, scaling, backup/DR, monitoring

## Quick start

```bash
cp .env.example .env   # fill in secrets — see docs/DEPLOYMENT.md
docker compose up -d
docker compose run --rm backend npx prisma migrate deploy
```

## Suggested next steps for a real team

1. Scaffold the remaining NestJS modules (`students`, `admin`, `courses`, `exam-centers`, `notifications`) following the patterns in `documents/` and `payments/`.
2. Build out the admin verification queue UI and public marketing pages.
3. Wire a real AV scanner and face-detection provider into the two marked integration points.
4. Write the test suites (Jest for unit/integration, Playwright for e2e) — CI is already set up to run them.
5. Run a WCAG audit with axe-core against every page before launch.
6. Load-test the registration and results-publication endpoints (these see the highest traffic spikes on real government portals) before going live.
