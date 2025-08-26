Below is a structured Markdown guide you can drop into docs/ (e.g., frontend-separation-execution-guide.md).

---

# Frontend Portal Separation Execution Guide

This guide provides step-by-step instructions to split the unified frontend into four Next.js portal apps while keeping the existing NestJS backend.

## 1. Goals

- Separate domain apps:
  - www.gametriggers.com (Landing/Marketing + Auth)
  - brand.gametriggers.com (E1)
  - streamer.gametriggers.com (E3)
  - admin.gametriggers.com (E2)
- Keep a single backend (NestJS).
- Introduce Turborepo + shared packages.
- Preserve role + permission logic (Eureka RBAC).

---

## 2. Target Monorepo Layout

```
apps/
  landing/
  brand-portal/
  streamer-portal/
  admin-portal/
  backend/
packages/
  shared-roles/
  shared-auth/
  shared-api/
  shared-ui/
  shared-types/
  shared-utils/
  shared-config/
  shared-hooks/
  shared-validation/
tools/
  scripts/
```

---

## 3. Phase Overview

| Phase | Objective | Safe to Parallel? |
|-------|-----------|-------------------|
| 0 | Turborepo + workspaces scaffold | No |
| 1 | Extract shared-roles, shared-types, shared-api | Yes (sequence inside) |
| 2 | Move backend into apps/backend | No |
| 3 | Create landing app | No |
| 4 | Clone landing → brand / streamer / admin | Yes |
| 5 | Extract shared-ui & shared-auth | No |
| 6 | Middleware + portal enforcement | No |
| 7 | Env + config unification | Yes |
| 8 | Deployment setup + CI matrix | No |
| 9 | Optimize + prune legacy | Yes |
| 10 | Remove unified frontend | Final gate |

---

## 4. Phase 0 – Turborepo Bootstrap

1. Add workspaces to root package.json:
   ```
   "workspaces": ["apps/*","packages/*","tools/*"]
   ```
2. Add turbo.json with pipeline (build, dev, test).
3. Create tsconfig.base.json with path aliases.
4. Ensure existing scripts still work (dev:unified kept temporarily).
5. Commit: feat: bootstrap turborepo layout.

---

## 5. Phase 1 – Core Shared Packages (Minimal)

Create packages:

1. shared-roles
   - Move eureka-roles.ts
   - Split later (keep index.ts initially).
2. shared-types
   - Move reusable schema/types (DTOs).
3. shared-api
   - Move api-client.ts → base client
   - Export endpoint modules incrementally.

Update imports in existing codebase to use aliases:
- @shared-roles
- @shared-types/*
- @shared-api/*

Run typecheck. Commit: feat: extract core shared packages.

---

## 6. Phase 2 – Relocate Backend

1. Move backend/ → apps/backend/
2. Update scripts referencing backend path.
3. Adjust any relative imports (if any).
4. Ensure build still works: npm run build.
5. Commit: chore: relocate backend into apps directory.

---

## 7. Phase 3 – Create Landing App

1. Create apps/landing/ with fresh Next.js 15 scaffold (App Router).
2. Copy only:
   - Marketing page(s)
   - Auth routes (sign in / register) + redirect logic.
3. Keep global styles, minimal layout.
4. Wire shared-roles + shared-auth (stub for now).
5. Commit: feat: landing app scaffold.

---

## 8. Phase 4 – Clone to Portals

1. Duplicate landing → brand-portal, streamer-portal, admin-portal.
2. Remove marketing/auth pages in portal apps (they will rely on landing for entry).
3. Add placeholder dashboard/page.tsx in each.
4. Add NEXT_PUBLIC_PORTAL_ID env usage.
5. Commit: feat: add brand, streamer, admin portal shells.

---

## 9. Phase 5 – Extract shared-ui and shared-auth

1. Move reusable components (atoms, primitives) into shared-ui.
2. Keep role-specific UI (admin tables, etc.) inside respective portal for now.
3. Create shared-auth:
   - Export buildNextAuthOptions()
   - Central session + role injection callback
4. Replace per-app NextAuth config with shared builder.
5. Commit: feat: shared-ui + shared-auth foundational extraction.

---

## 10. Phase 6 – Portal Middleware

In each portal app:

1. Add middleware.ts:
   - Read session (NextAuth / token).
   - Verify role portal mapping.
   - Redirect mismatch to correct portal domain.
2. Add /access-denied route.
3. In landing: post-auth redirect logic chooses portal domain.
4. Commit: feat: add portal enforcement middleware.

---

## 11. Phase 7 – Environment & Config

1. Root .env (shared secrets).
2. Per portal .env.brand/.env.streamer/.env.admin:
   - NEXT_PUBLIC_PORTAL_ID
   - NEXTAUTH_URL
   - NEXT_PUBLIC_API_BASE_URL
3. shared-config: implement layered loader (portal overrides > root).
4. Add cookie domain = .gametriggers.com.
5. Commit: chore: unified env + config resolution.

---

## 12. Phase 8 – Deployment Strategy

Choose Scenario (Recommended initial): Vercel (frontends) + containerized backend.

Frontends:
- Each portal = Vercel project pointing to monorepo root.
- Build command: npm run build --filter=<app>...
- Install command: npm install
- Output: .next

Backend:
- Dockerfile → push to registry → deploy (Render/ECS/Fly).
- Expose https://api.gametriggers.com.

DNS:
- CNAME brand / streamer / admin / www to respective Vercel deployments.
- A / CNAME api.gametriggers.com → backend load balancer.

Commit: docs: deployment config added.

---

## 13. Phase 9 – Optimization & Pruning

1. Tree-shake shared-ui (index re-exports atomic components).
2. Remove unused legacy pages in each portal.
3. Add route-based code splitting for heavy analytics pages.
4. Add request ID logging (shared-utils logger).
5. Commit: perf: portal pruning + logging.

---

## 14. Phase 10 – Decommission Unified Frontend

1. Confirm traffic stable on portals.
2. Remove old unified dashboard routes.
3. Archive legacy frontend folder sections (optional tag).
4. Remove dev:unified script if no longer needed.
5. Commit: chore: remove legacy unified frontend.

---

## 15. Auth Flow Summary

1. User hits www → sign in → callback determines primary role → redirect:
   - Brand role → brand.gametriggers.com
   - Publisher role → streamer.gametriggers.com
   - Admin role → admin.gametriggers.com
2. Wrong portal access → middleware corrects or denies.
3. Shared cookie (domain=.gametriggers.com) enables SSO across subdomains.

---

## 16. Testing Adjustments

- Jest projects per package/app.
- Playwright per portal (baseURL override).
- Contract tests: generate OpenAPI → validate shared-api types (later enhancement).
- Add portal mismatch test (assert redirect).

---

## 17. CI/CD Outline (GitHub Actions)

Jobs:
- install (cache node_modules)
- lint (turbo run lint)
- typecheck (tsc -b or turbo run build --dry=typescript)
- test (turbo run test --filter=...[changed])
- build (turbo run build)
- deploy (conditional on main/dev branch)

Matrix per app only for deploy job.

---

## 18. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Import drift | Enforce path aliases + eslint no-restricted-imports |
| Session inconsistency | Centralize NextAuth config in shared-auth |
| Over-fat shared-ui | Enforce atomic exports; avoid barrel re-export storms |
| Circular deps | Keep dependency direction: types → roles → auth → api → ui |
| Partial migration confusion | Maintain migration status doc |

---

## 19. Rollback Strategy

- Keep unified version until Phase 8 stable.
- DNS switch reversible (TTL low).
- Keep feature flags for new portal-only components.
- Tag repo before Phase 10.

---

## 20. Immediate Action Checklist

[ ] Add workspaces + turbo  
[ ] Create shared-roles / shared-types / shared-api  
[ ] Move backend to apps/backend  
[ ] Scaffold landing  
[ ] Duplicate to three portals  
[ ] Extract shared-ui + shared-auth  
[ ] Implement middleware per portal  
[ ] Configure env sets + config loader  
[ ] Set up CI matrix  
[ ] Deploy backend + one portal (smoke test)  
[ ] Roll out remaining portals  

---

Need a generated starter docs file or initial package skeletons next? State which phase to execute and it will be prepared.