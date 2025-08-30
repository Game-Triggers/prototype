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
## Phase 2+ (Preview)

Next major step: Move backend into `apps/backend/` and unify path resolution (handled after Phase 1 stabilization).

--------------------------------------------------------------------------------
## Immediate Action Quick Checklist

[ ] Add pnpm + workspace files  
[ ] Add turbo.json  
[ ] Add tsconfig.base.json + path aliases  
[ ] Create shared-roles (copy eureka-roles)  
[ ] Create shared-types (copy schema types)  
[ ] Create shared-api (wrap api-client)  
[ ] Update imports in frontend  
[ ] Validate build + dev  
[ ] Remove legacy duplicates / add shims  
[ ] Commit Phase 0 + Phase 1  

--------------------------------------------------------------------------------
Need the actual scaffold files generated next (pnpm-workspace.yaml, turbo.json, package.json fragment, initial package skeleton)? Reply: proceed with scaffold and I will prepare them.