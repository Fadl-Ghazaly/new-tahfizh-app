# Tahfizh-App AI Engineering Instructions

## Project

Tahfizh-App is a Quran memorization management system for Pesantren Darul Ilmi.

Read the following documentation before implementing features:

- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/SCHEMA.md
- docs/RULES.md
- docs/DESIGN.md

Some documents may not exist during early project setup. Do not invent their contents. Work with the available documentation and update the documentation when architecture decisions are made.

---

## Technology

The planned technology stack is:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Recharts
- React Hook Form
- Zod

---

## General Coding Rules

1. Use TypeScript.
2. Avoid `any`.
3. Prefer reusable components.
4. Avoid duplicated business logic.
5. Keep business logic separate from presentation.
6. Validate user input.
7. Handle loading, error, and empty states.
8. Follow the existing project architecture.
9. Do not introduce dependencies without a clear reason.
10. Do not modify unrelated files.
11. Do not rewrite working code unnecessarily.

---

## Database Rules

1. Database schema is the source of truth for persisted data.
2. Use foreign keys for relationships.
3. Use database constraints where appropriate.
4. Do not store derived analytics unnecessarily.
5. Do not duplicate Quran data across UI components.
6. Respect Supabase Row Level Security.
7. Never rely solely on frontend authorization.

---

## Tahfizh Rules

The system uses:

- SABAQ
- SABQI
- MANZIL

Progress calculation:

15 lines = 1 page.

20 pages = 1 juz.

Therefore:

1 juz = 300 lines.

All progress calculations must use a shared utility.

Never implement different formulas in different pages.

---

## Fluency Rules

Default fluency score:

100.

Each mistake:

-5.

Minimum:

0.

---

## Authentication

Supported roles:

- ADMIN
- USTADZ

Authorization must be enforced server-side and at the database level.

---

## AI Workflow

Before implementing a feature:

1. Read relevant documentation.
2. Inspect existing code.
3. Identify reusable components.
4. Identify related database structures.
5. Implement the smallest coherent change.
6. Run validation.
7. Run type checking.
8. Run linting.
9. Run relevant tests.
10. Report what changed.

Do not implement unrelated features.

---

## Important

If a requirement conflicts with the existing architecture or database model:

Do not silently choose a solution.

Explain the conflict and propose the safest approach before making a major architectural change.

Baca RULES.md dan semua file di docs/ sebelum mengerjakan tugas.