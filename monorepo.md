Below is the updated guide using pnpm + Turborepo, with Phase 0 and Phase 1 expanded into a highly detailed, step‑by‑step, execution‑ready format.

--------------------------------------------------------------------------------
# Frontend Portal Separation – Monorepo Execution Guide (pnpm + Turborepo)

This document guides the migration from the current unified Next.js + embedded NestJS setup into a Turborepo monorepo using pnpm, introducing multi-portal architecture.

Portals (target):
- www.gametriggers.com (Landing/Auth/Marketing)
- brand.gametriggers.com (E1 – Brand)
- streamer.gametriggers.com (E3 – Publisher/Streamer)
- admin.gametriggers.com (E2 – Admin)
- Backend: Single NestJS app (kept intact, moved under apps/)

--------------------------------------------------------------------------------
## Monorepo Target Layout

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

--------------------------------------------------------------------------------
## Conventions

- Package manager: pnpm
- Workspaces: pnpm native (pnpm-workspace.yaml)
- Build runner: Turborepo
- TypeScript root: tsconfig.base.json
- Import aliases: via paths in tsconfig.base.json only
- All shared code must reside in packages/* (no cross-app deep relative imports)
- Keep existing unified run script `dev:unified` temporarily (until final decommission)

--------------------------------------------------------------------------------
## Phase 0 – Turborepo + pnpm Bootstrap (Foundational)

Goal: Introduce pnpm + Turborepo without moving functional code yet (minimal risk).

### 0.1 Pre‑Checks

Checklist:
- Node version consistent across contributors (decide e.g., 20.x).  
- Ensure current git working tree clean.  
- Communicate freeze on adding new dependencies until Phase 1 complete.

Validation command (before changes):
- npm run build (baseline sanity)
- Record build time (optional for later comparison)

### 0.2 Introduce pnpm

1. Install pnpm globally (each developer):
   - Core team (local machine): `npm i -g pnpm`
2. Add `packageManager` field to root package.json (example):
   ```
   "packageManager": "pnpm@9.9.0"
   ```
3. Remove node_modules locally (developer machine):
   - `rm -rf node_modules`
4. (Do NOT delete package-lock.json yet; keep until after validation step 0.7.)

### 0.3 Create pnpm Workspace Manifest

Add `pnpm-workspace.yaml` at repo root:
```
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
  - "schemas"
  - "backend"        # temporary until moved to apps/backend
```

(We will remove backend root entry after relocation in Phase 2.)

### 0.4 Add turbo.json

Create `turbo.json`:
```
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**","dist/**","build/**"]
    },
    "dev": {
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 0.5 Root Scripts (Incremental)

Adjust root package.json (add, keep existing scripts):
```
"scripts": {
  "dev": "turbo run dev --parallel",
  "build": "turbo run build",
  "typecheck": "turbo run typecheck",
  "lint": "turbo run lint",
  "test": "turbo run test",
  "dev:unified": "node server.js",
  "...existing scripts..."
}
```

Do NOT remove old `build`, `deploy` yet—will refactor later.

### 0.6 Create tsconfig.base.json

Add at root:
```
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@shared-roles": ["packages/shared-roles/src/index"],
      "@shared-api/*": ["packages/shared-api/src/*"],
      "@shared-types/*": ["packages/shared-types/src/*"],
      "@shared-auth/*": ["packages/shared-auth/src/*"],
      "@shared-utils/*": ["packages/shared-utils/src/*"],
      "@shared-config/*": ["packages/shared-config/src/*"],
      "@shared-hooks/*": ["packages/shared-hooks/src/*"],
      "@shared-ui/*": ["packages/shared-ui/src/*"],
      "@shared-validation/*": ["packages/shared-validation/src/*"]
    }
  }
}
```

Update existing root tsconfig.json to extend:
```
{
  "extends": "./tsconfig.base.json",
  "...existing fields..."
}
```

Backend tsconfig also should extend this after move (Phase 2).

### 0.7 Install Dependencies with pnpm

Run:
- `pnpm install`

Validate:
- `pnpm dev:unified` still works
- `pnpm run build` (should still succeed; initial pipeline just runs current app’s build)

If issues:
- Ensure no scripts explicitly call `npm` internally (replace with `pnpm` where safe)
- Keep `npm` usage only if external tool expects it (temporarily acceptable)

### 0.8 (Optional) Configure pnpm Settings

Add `.npmrc` (root):
```
strict-peer-dependencies=false
auto-install-peers=true
shamefully-hoist=true
```
Rationale:
- Next.js + mixed ecosystem packages sometimes expect hoisting.
- Revisit later to tighten.

### 0.9 Validation Checklist

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Install | pnpm install | No peer errors blocking |
| Unified dev | pnpm run dev:unified | Server boots identical to before |
| Build | pnpm run build | Success exit code |
| Git diff | git diff | Only intended workspace config changes |

### 0.10 Commit

Message: `chore(monorepo): bootstrap turborepo with pnpm workspace`

After merge into dev branch, instruct all contributors to prune old node_modules and use pnpm.

### 0.11 Rollback Plan (If Critical Failure)

1. Restore previous commit (git revert).
2. Delete pnpm-lock.yaml.
3. Reinstall with npm install.
4. Communicate rollback reason.

Rollback Indicators:
- Repeated unresolved module resolution failures
- Incompatibility with deployment platform
- CI pipeline blocked > 24h

--------------------------------------------------------------------------------
## Phase 1 – Extract Core Shared Packages (roles, types, api)

Goal: Isolate foundational shared logic with minimal surface area to unlock future app splits. Must remain backward-compatible with existing unified app.

Order matters: roles → types → api (api may depend on types & roles).

### 1.1 Prepare Directory Skeleton

Create directories:
```
packages/
  shared-roles/
    package.json
    src/
      index.ts
  shared-types/
    package.json
    src/
      index.ts
  shared-api/
    package.json
    src/
      index.ts
```

### 1.2 Package Manifests (Initial)

Example package.json:
```
{
  "name": "@gametriggers/shared-roles",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  }
}
```
Repeat with names:
- @gametriggers/shared-types
- @gametriggers/shared-api

(Use consistent naming convention.)

### 1.3 Move Roles Logic

Source file: eureka-roles.ts

Action:
- Copy (not move yet) into eureka-roles.ts
- Create `packages/shared-roles/src/index.ts` re-exporting public API:
  ```
  export * from './eureka-roles';
  ```
Refactor later into modular files (permissions, portal mapping) in Phase 5+.

### 1.4 Identify Types

Scope for Phase 1:
- Reusable domain types: user roles, permissions, DTO shapes already used by both backend & frontend (if safe).
- Avoid moving schema generation or complex runtime transforms in this phase.

Inspect existing:
- schema-types.ts (and its compiled outputs)
Action:
- Move raw TypeScript declarations into `packages/shared-types/src/`
- If file includes runtime logic, split into types-only file (e.g., `domain.ts`) to avoid side effects.

Create `packages/shared-types/src/index.ts` aggregating exports.

Leave backend references unchanged for now—will adjust imports only in unified frontend code first to minimize blast radius.

### 1.5 Extract API Client

Source: api-client.ts

Action:
1. Copy to `packages/shared-api/src/http-client.ts`
2. Create `packages/shared-api/src/index.ts`:
   ```
   export * from './http-client';
   ```
3. If direct references to process.env.* appear:
   - Wrap base URL resolution:

   ```
   export function getApiBase() {
     if (typeof window === 'undefined') {
       return process.env.API_BASE_URL_INTERNAL || process.env.API_BASE_URL || 'http://localhost:3000';
     }
     return process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
   }
   ```

4. Ensure no circular dependency created (shared-api MUST NOT import frontend components).

### 1.6 Update Import Paths in Frontend

Strategy:
- Replace occurrences of relative imports referencing moved modules.
- Search patterns:
  - `from '../lib/eureka-roles'`
  - `from '@/lib/eureka-roles'`
  - `from '@/lib/api-client'`
  - `from '@/lib/schema-types'`

Replace with:
- `from '@shared-roles'`
- `from '@shared-api/http-client'` (or just `@shared-api` if index re-export)
- `from '@shared-types'`

Do NOT update backend imports yet (optional optimization after Phase 2 when backend moves into apps/).

### 1.7 TypeScript & Build Validation

Commands:
- `pnpm run typecheck` (if defined; otherwise `pnpm tsc --noEmit`)
- `pnpm run build`

Acceptance:
- No unresolved module alias errors.
- Any leftover imports flagged → fix path alias entry or rename.

### 1.8 Remove Old Duplicates

After validation:
- Remove original eureka-roles.ts ONLY if all references updated.
- For `schema-types.*` confirm not required by build scripts generating compiled JS (if needed by scripts, keep a shim file exporting from package):

Shim example in schema-types.ts:
```
export * from '@shared-types';
```

### 1.9 Lint (Optional, lenient per project note)

Skip strict cleanup (as linting not enforced), but ensure no accidental console noise introduced.

### 1.10 Minimal Tests (If Any)

If test suite references old paths:
- Adjust imports.
- Run: `pnpm run test` (expect green or unchanged failures).

### 1.11 Commit

Message: `feat(monorepo): extract shared-roles, shared-types, shared-api packages`

### 1.12 Risks & Mitigations

| Risk | Symptom | Mitigation |
|------|---------|------------|
| Circular deps | TS compile hang / runtime undefined exports | Keep packages pure; roles/types no api-client import |
| Env leakage | API client fails SSR | Provide safe fallback base URL |
| Duplicate type definitions | Conflicts in editor intellisense | Single export barrel, remove legacy file |
| Side effects in shared packages | Unexpected runtime errors | Ensure only pure exports; no DB/init code |

### 1.13 Rollback Strategy

If severe breakage:
1. Revert commit.
2. Restore original files in lib.
3. Delete new packages directories.
4. Re-run `pnpm install`.

### 1.14 Completion Criteria (Exit Gate)

All must be true:
- Unified app runs using imports from packages (not legacy files).
- No direct feature regressions (campaigns/wallet basic flows unaffected).
- Build pipeline time not meaningfully degraded.
- Team informed of new import paths.

--------------------------------------------------------------------------------
## Phase 2 – Multi‑Portal Scaffolding (Landing / Streamer / Brand / Admin)

Goal: Create 4 separate Next.js App Router applications without yet moving real feature code. Provide skeletons, shared layout primitives, health checks, and role access placeholders.

### 2.1 Directory Scaffold
```
apps/
  landing/            # marketing + auth + post-login redirect logic
    app/
      layout.tsx
      page.tsx        # marketing homepage (stub)
      auth/
        login/page.tsx (placeholder)
        callback/route.ts (if custom)
      access-denied/page.tsx
      health/route.ts # returns 200 JSON {status:'ok'}
  streamer-portal/
    app/
      layout.tsx
      page.tsx        # dashboard placeholder
      access-denied/page.tsx
      health/route.ts
  brand-portal/
    app/ (same pattern)
  admin-portal/
    app/ (same pattern)
```
Add minimal Tailwind setup (can share via `packages/shared-ui` later). Each portal: re‑export a local `Providers` component wrapping `SessionProvider` + theming.

### 2.2 package.json for Each App (initial)
Example (`apps/streamer-portal/package.json`):
```
{
  "name": "@gametriggers/streamer-portal",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```
Repeat for other apps (change name only). Keep backend untouched.

### 2.3 Root Scripts Augmentation
Add parallel dev convenience (later):
```
"dev:portals": "turbo run dev --filter=@gametriggers/*-portal --parallel"
```
Keep `dev:unified` until Phase 6.

### 2.4 Shared Config Consumption
All portals rely on path aliases from `tsconfig.base.json`. Add a local `tsconfig.json` inside each portal extending root (no custom paths locally):
```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {"module": "ESNext"},
  "include": ["next-env.d.ts","**/*.ts","**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 2.5 Environment Variable Strategy (Initial)
Cross‑subdomain auth requires consistent cookie domain:
```
NEXTAUTH_URL=https://<portal-domain>
NEXTAUTH_SECRET=... (shared)
APP_DOMAIN_BASE=.gametriggers.com  # custom var for cookie domain logic
```
Landing app handles sign in; other portals perform silent session fetch.

### 2.6 Verification Checklist (Exit Gate Phase 2)
- All 4 portal apps `next build` successfully (stub pages only)
- `pnpm dev` can run them in parallel (each on auto-assigned port)
- Health endpoints return 200
- No shared business logic duplicated—only placeholders

--------------------------------------------------------------------------------
## Phase 3 – Shared Auth & Role Routing Unification

Goal: Centralize NextAuth config, role definitions, and portal routing rules. Enable cross‑portal session consumption.

### 3.1 Create `packages/shared-auth`
Structure:
```
packages/shared-auth/
  package.json
  src/
    index.ts
    nextauth-options.ts
    portal-routing.ts
    session-augment.d.ts
```
`nextauth-options.ts`: exports `buildAuthOptions()` creating providers (Twitch, YouTube, etc.) relying on env. No portal‑specific code.

`portal-routing.ts` contains:
```
export const Portal = {
  LANDING: 'landing',
  STREAMER: 'streamer',
  BRAND: 'brand',
  ADMIN: 'admin'
} as const;

export function resolvePortalForUser(user) {
  // inspect roles from @shared-roles
  // return one of Portal.*
}

export function portalBaseUrl(portal) { /* map to https://<portal>.gametriggers.com */ }
```

### 3.2 Session & Role Augmentation
Add declaration merging in `session-augment.d.ts` to extend `Session.user` with `roles: string[]` & any domain IDs.

### 3.3 Landing Post‑Login Redirect Flow
In landing `auth` callback handler:
1. Fetch session
2. Call `resolvePortalForUser(session.user)`
3. 302 redirect to computed portal base
4. If no resolvable portal (e.g., incomplete signup) route to `/onboarding` in landing.

### 3.4 Portal Middleware Enforcement
Each portal `middleware.ts` pattern:
```
import { getToken } from 'next-auth/jwt';
import { resolvePortalForUser } from '@shared-auth/portal-routing';

export async function middleware(req) {
  const token = await getToken({ req });
  if (!token) return Response.redirect(new URL('https://www.gametriggers.com/auth/login'));
  const allowed = /* portal specific role check */;
  if (!allowed) return Response.redirect(new URL('https://www.gametriggers.com/access-denied'));
  return Response.next();
}
```
Define per‑portal `isAllowed(userRoles)` functions in shared-roles to avoid drift.

### 3.5 Cookie Domain Configuration
If using custom adapter / cookie overrides: set cookie domain to `.gametriggers.com` (NOT per subdomain) so session is readable across portals. Validate no sensitive portal‑specific state stored in same cookie.

### 3.6 SSR & Client Hooks
Add `useCurrentUser()` hook inside `packages/shared-auth` reading from `next-auth/react` to standardize consumption. Avoid duplicating logic in each portal.

### 3.7 Exit Gate Phase 3
- Single source of truth for role constants & portal mapping
- Landing redirect logic working manually (test each role user)
- Portals deny unauthorized access via middleware

--------------------------------------------------------------------------------
## Phase 4 – Incremental Feature Migration

Goal: Move existing unified frontend feature areas into their respective portals with controlled, low‑risk iterations.

### 4.1 Migration Principles
- Vertical slice approach: move one feature (pages + components + hooks + minor assets) per PR.
- Replace old import paths with `@shared-*` packages; never copy logic into app folders.
- Provide a compatibility redirect in unified app (old path -> new portal URL) until decommission.

### 4.2 Prioritized Feature Order
1. Streamer dashboard core (XP/level, campaign list)
2. Brand campaign management UI
3. Admin analytics / moderation tools
4. Remaining marketing / general pages reside in landing only

### 4.3 Operational Checklist Per Feature Slice
1. Identify pages/components to move
2. Extract pure helpers → move to `packages/shared-utils` if reused
3. Update imports in moved files
4. Add route tests (if testing infra present)
5. Remove legacy route or add redirect
6. Smoke test portal build & dev
7. Commit `feat(portal): migrate <feature>`

### 4.4 Tracking Matrix (Maintain in README or dedicated doc)
```
| Feature                | Old Path                | New Portal          | Status | Redirect Added |
|------------------------|-------------------------|---------------------|--------|----------------|
| Streamer Dashboard     | /dashboard              | streamer /          | ✓      | ✓              |
| Brand Campaign Create  | /brand/campaigns/new    | brand-portal /...   | ...    | ...            |
```

### 4.5 Performance & DX Considerations
- After each migration, run `turbo run build --filter=<portal>` to validate scope.
- Use dynamic imports for heavy admin-only charts.

### 4.6 Exit Gate Phase 4
- All user‑facing functionality removed from unified root app
- Portals stable in staging

--------------------------------------------------------------------------------
## Phase 5 – Backend Relocation to apps/backend

Goal: Align backend with monorepo layout; enable shared path aliases & future service extraction.

### 5.1 Move
`mv backend apps/backend`

### 5.2 Update Workspace & Paths
Remove `backend` root entry from `pnpm-workspace.yaml` if present; ensure `apps/backend` included automatically via `apps/*`.

### 5.3 tsconfig Alignment
Inside `apps/backend/tsconfig.json`:
```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {"outDir": "dist"},
  "include": ["src","../..../types"],
  "exclude": ["node_modules"]
}
```

### 5.4 Start Script Update
Backend package.json (if separate) or root script: ensure `turbo run dev --filter=@gametriggers/backend` works. Optionally add `"dev:backend": "turbo run dev --filter=@gametriggers/backend"`.

### 5.5 API Access Pattern
Short term: portals call same origin + `/api/nest/` if reverse proxy in front couples them. Longer term option: expose backend on `api.gametriggers.com` and set `NEXT_PUBLIC_API_BASE_URL` accordingly in each portal.

### 5.6 Swagger & Shared Types
Generate types (if codegen) into `packages/shared-types/src/generated` so portals consume strongly typed DTOs.

### 5.7 Exit Gate Phase 5
- Backend builds & runs from new location
- Portals unaffected (API calls function)
- CI updated to reference new path

--------------------------------------------------------------------------------
## Phase 6 – Decommission Unified Frontend & Hardening

### 6.1 Remove Legacy
Delete obsolete root pages/components after final portal verification; keep only minimal root index optionally redirecting to landing.

### 6.2 Script Cleanup
Remove `dev:unified` once traffic fully switched; adjust docs.

### 6.3 Observability & Logging
Introduce centralized logging package (e.g., `packages/shared-logging`) if needed.

### 6.4 Security Review
- Verify middleware access rules
- Audit shared packages for accidental secrets exposure

### 6.5 Load & Performance Tests
Run targeted load tests on backend + critical portal APIs.

### 6.6 Exit Gate Phase 6
- No code paths depend on removed unified app artifacts
- Monitoring dashboards green (errors, latency)
- Stakeholder sign‑off

--------------------------------------------------------------------------------
## Environment Variable Reference (Living Section)
```
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=           # per portal deployment URL
APP_DOMAIN_BASE=.gametriggers.com

# API Base (frontend)
NEXT_PUBLIC_API_BASE_URL=/api/nest
API_BASE_URL_INTERNAL=http://localhost:3000/api/nest

# Feature Flags
FEATURE_PORTAL_SPLIT=true
```
Maintain in a `.env.example` at root (exclude secrets).

--------------------------------------------------------------------------------
## Testing Strategy Expansion

| Layer          | Scope                                     | Tools | Notes |
|----------------|-------------------------------------------|-------|-------|
| Unit           | shared-* packages pure funcs              | Jest  | Fast feedback |
| Integration    | Auth flows, API client <-> backend        | Jest / Supertest | Mock external APIs |
| E2E (Portal)   | Role redirects, protected routes          | Playwright | Separate projects per portal |
| Contract       | Backend Swagger ↔ generated types         | openapi-typescript | Fails build on drift |
| Performance    | Critical endpoints (login, campaign list) | k6 / Artillery | Run nightly |

Add a `packages/shared-testing` later for mocks & test utils.

--------------------------------------------------------------------------------
## Risk Matrix (Cumulative)

| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Session cookie mis-scope | 3 | Users forced to re-login per portal | Medium | Explicit cookie domain test in staging |
| Role mapping divergence | 3-4 | Unauthorized access / lockout | Low | Central shared-roles export + unit tests |
| Circular deps across shared packages | 1-5 | Build failures | Medium | Enforce lint rule / graph check script |
| Backend path break after move | 5 | Outage | Low | Dual environment test before cutover |
| Gradual feature drift (old vs new) | 4 | QA complexity | Medium | Tracking matrix + weekly review |

--------------------------------------------------------------------------------
## Rollback Playbooks (Per Phase)

| Phase | Condition Trigger | Immediate Action | Cleanup |
|-------|--------------------|------------------|---------|
| 2 | Portal skeleton build fails | Revert scaffold commit | Re-run pnpm install |
| 3 | Auth redirect loops | Revert shared-auth changes only | Clear cookies, redeploy |
| 4 | Critical feature regression | Re-enable legacy route, revert migration PR | Add test before retry |
| 5 | Backend cannot start post-move | Revert move commit | Investigate path/tsconfig |
| 6 | Unexpected production errors spike | Temporarily restore unified fallback (if retained) | Add monitoring alerts |

--------------------------------------------------------------------------------
## Suggested Timeline (Example)

| Week | Focus |
|------|-------|
| 1 | Phase 0 + 1 complete (bootstrap + core packages) |
| 2 | Phase 2 scaffold + Phase 3 auth unification |
| 3-4 | Phase 4 feature migrations (streamer + brand) |
| 5 | Admin + remaining migrations; start Phase 5 backend move |
| 6 | Phase 5 finalize, hardening tests |
| 7 | Phase 6 decommission & performance/security review |

--------------------------------------------------------------------------------
## Communication Checklist
- Announce pnpm adoption (with install instructions)
- Share new import alias policy
- Weekly portal migration progress post
- Pre‑cutover backend move notice (24h beforehand)
- Final decommission announcement

--------------------------------------------------------------------------------
## Living Maintenance Tasks
- Keep `tsconfig.base.json` alias list authoritative
- Update `.env.example` whenever adding env var
- Periodically prune unused exports in shared-* packages
- Add CI job to detect circular dependencies (e.g., madge)

--------------------------------------------------------------------------------
## Quick Start (After Full Migration)
```
pnpm install
pnpm dev              # runs all portals + backend
pnpm dev --filter=@gametriggers/streamer-portal
pnpm build            # turbo cached builds
```

--------------------------------------------------------------------------------
## Completion Definition of Done (Entire Initiative)
- All portals isolated, backend relocated, unified app removed
- Shared packages documented & versioned (even if private)
- CI green: build, typecheck, minimal tests, contract check
- Observability in place (logs, metrics)
- Stakeholder signoff & retro performed

--------------------------------------------------------------------------------
(End of Document – keep sections appended rather than replaced to preserve historical context.)