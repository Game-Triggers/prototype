Executive Summary
Goal: Extract shared/domain code into isolated versioned packages in a Turborepo (pnpm) to enable multi-portal scalability, clearer ownership, faster builds, and safer deployments. Recommendation: 5 foundational (Phase 1) + 6 domain (Phase 2) + 5 UI/app (Phase 3) + 4 infra/config (Continuous). Use Semantic Versioning + Changesets with a mostly independent (multi-package) versioning model, but lock core schema/type packages initially.

Proposed Monorepo Top-Level Structure
/ (workspace root)
  /apps
    web-next   (current Next.js app)
    api-nest   (current Nest backend)
    landing-site (future)
    portal-admin (future split)
  /packages
    core-types
    core-schemas
    auth-shared
    roles-permissions
    api-client
    level-system
    xp-system
    rp-system
    currency
    notifications
    contexts
    utils
    config-ts
    config-eslint
    config-tailwind
    config-env
    react-ui-primitives
    react-hooks
    build-tools (optional meta if needed)
  /tooling (optional: scripts)
  /docs
  /.changeset

Detailed Package Breakdown (Fields: 1 Name, 2 Current Location(s), 3 External Deps, 4 Internal Dependents (now), 5 Migration Effort, 6 Priority, 7 Type)

Foundational / Phase 1
1 @eureka/core-types
2 lib/schema-types.ts, enums in eureka-roles.ts (enum splitting), interfaces in hooks
3 none (TS only)
4 frontend components, api-client, backend (should depend after extraction)
5 Low
6 Critical
7 Utility
1 @eureka/roles-permissions
2 lib/eureka-roles.ts, lib/role-validation.ts, eureka-role.service.ts (logic duplicate usage)
3 none (maybe zod if later validating)
4 frontend auth gating, backend auth module
5 Medium (must refactor backend import path)
6 Critical
7 Service
1 @eureka/auth-shared
2 auth.ts (NextAuth options), token shape, minimal DTO overlap in backend auth/dto
3 next-auth, jose (if used), axios (if reused), zod (if added)
4 Next.js app, future CLI or integration tests
5 Medium
6 High
7 Service
1 @eureka/core-schemas
2 schemas/*.schema.ts (Mongoose models & schema shape) need split: shared zod/types vs server-only Mongoose
3 zod (introduce), class-validator (optional adapter), mongoose (only in sub-entry server build)
4 backend modules, frontend (type-only)
5 High (requires disentangling Mongoose from shareable data contracts)
6 Critical
7 Utility
1 @eureka/utils
2 lib/utils.ts, simple pure helpers across code
3 dayjs (if used), lodash-es (if adopted)
4 almost all layers
5 Low
6 High
7 Utility

Domain Logic / Phase 2
1 @eureka/api-client
2 api-client.ts
3 axios/fetch, next-auth (session usage) -> refactor to accept token provider interface
4 frontend app routes, components
5 Medium
6 High
7 Service
1 @eureka/level-system
2 level-constants.ts + level-constants.ts (duplicate)
3 none
4 contexts/level, backend leveling logic
5 Medium
6 High
7 Utility
1 @eureka/xp-system
2 xp-constants.ts + xp-constants.ts
3 none
4 xp-context, backend xp calc
5 Low
6 Medium
7 Utility
1 @eureka/rp-system
2 rp-constants.ts + rp-constants.ts
3 none
4 rp-context, backend rp calc
5 Low
6 Medium
7 Utility
1 @eureka/currency
2 currency-config.ts
3 none (optionally money.js / Dinero later)
4 wallet components, billing flows backend
5 Low
6 Medium
7 Utility
1 @eureka/notifications
2 lib/hooks/use-notifications.ts, related types
3 next-auth (session) – abstract
4 bell component, notifications page
5 Medium
6 Medium
7 Component/Service

React Composition / Phase 3
1 @eureka/react-contexts
2 lib/contexts/*.tsx
3 react, next-auth (abstract)
4 pages, UI displays
5 Medium
6 Medium
7 Component
1 @eureka/react-hooks
2 hooks (current and future: use-notifications after domain extraction)
3 react
4 components
5 Low
6 Low
7 Component
1 @eureka/react-ui-primitives
2 components/ui/* (atoms), layout primitives
3 react, tailwind (peer), radix/ui (if added)
4 all portal UIs
5 High (design tokens)
6 Medium
7 Component

Configuration / Infra (Continuous)
1 @eureka/config-ts
2 root tsconfig.json
3 typescript
4 all TS packages
5 Low
6 High
7 Configuration
1 @eureka/config-eslint
2 eslint.config.mjs (root + backend variant)
3 eslint, @typescript-eslint/*
4 all workspaces
5 Low
6 High
7 Configuration
1 @eureka/config-tailwind
2 tailwind/postcss files (postcss.config.mjs, tailwind.config if added)
3 tailwindcss
4 frontend apps
5 Low
6 Medium
7 Configuration
1 @eureka/config-env
2 central .env conventions docs + runtime validator
3 zod / envalid
4 frontend + backend at bootstrap
5 Medium
6 High
7 Configuration
1 @eureka/build-tools (optional)
2 scripts/, tooling build scripts
3 tsup / turbo
4 CI/CD, all packages
5 Low
6 Low
7 Configuration

Other Candidates (Defer / As Needed)
- @eureka/analytics-dto (shared DTOs)
- @eureka/billing (future payment logic)
- @eureka/test-utils (Jest/Playwright utilities)
- @eureka/integrations-(provider) (future modular external APIs)

Circular / Tight Coupling Observations
- roles-permissions ↔ backend auth service currently imports shared enumerations: must invert by letting backend depend on package only (no frontend import).
- api-client presently depends on NextAuth session directly; break by injecting a TokenProvider to avoid frontend-only dependency in shared code.
- contexts import each other (level-context imports xp/rp) forming a soft coupling; consider splitting pure calculators (in level/xp/rp packages) from React state containers.
- schema files mix runtime (Mongoose) and shape. Split: sharedData (zod + types) vs serverModel (Mongoose) to prevent frontend bundling mongoose accidentally.

Grouping Strategy
Core layer (types, schemas, roles, utils)
Domain layer (level/xp/rp, currency, notifications)
Interface layer (api-client, react-contexts, react-hooks)
UI layer (ui-primitives)
Config layer (config-* packages)
Service-specific (future microservices DTO packages)

Versioning Strategy
- Use Changesets.
- Locked (fixed) versioning among core foundational packages initially: core-types, roles-permissions, core-schemas to simplify atomic upgrades.
- Independent versioning for domain/UI packages (faster iteration).
- Pre-release channels: next for breaking refactors (e.g., schema extraction), tag with dist-tags.
- Follow SemVer; treat type changes that can break compilation as MAJOR.

Breaking Changes to Flag
- Import paths change (@/lib/... -> @eureka/...)
- Removal of mongoose types from frontend-facing schema packages
- Auth session token shape externalization (consumers must adopt new interface)
- API client method signatures (token injection)
- Potential rename of role enums (stabilize now)
- React context provider tree adjustments (root layout modifications)

Migration Roadmap (Phases with Duration Estimates)
Phase 0 (Prep) – 1 week
- Introduce pnpm + workspace root config
- Add turbo + basic pipeline (build, lint, dev)
- Add Changesets
Phase 1 (Foundational) – 2–3 weeks
- Extract core-types, roles-permissions, utils
- Create core-schemas (split types vs mongoose)
- Extract auth-shared (shared token/session types)
- Adjust backend & frontend imports
Phase 2 (Domain Logic) – 2 weeks
- Extract level/xp/rp-system, currency
- Normalize calculators & remove duplication
- Refactor api-client (token provider)
- Extract notifications (domain shape + hook)
Phase 3 (React & UI) – 3–4 weeks (parallelizable)
- Extract react-contexts (depend on domain packages)
- Extract react-hooks (pure)
- Begin react-ui-primitives design tokens
Phase 4 (Config & Hardening) – 1–2 weeks
- config-ts, config-eslint, config-tailwind, config-env
- Enforce with eslint shareable config & ts references
Phase 5 (Stabilization) – 1 week
- CI matrix, publish dry runs, docs, deprecate legacy paths

High-Level Timeline: ~10–13 weeks (can compress with parallel squads)

Complexity Drivers
High: schema disentangling, UI primitive design, permission normalization
Medium: api-client abstraction, auth shared extraction
Low: constants, utils, eslint/ts configs

Risk Assessment & Mitigations
1 Schema/Model Drift
- Mitigation: Introduce zod schemas as single source; generate TS types + runtime validators.
2 Secret / Env Leakage
- Mitigation: config-env package validates required vars at build/start.
3 Bundle Size Increase
- Mitigation: Ensure pure ESM, sideEffects: false, tree-shake.
4 Circular Dependencies
- Mitigation: Layered import lint rule (eslint-plugin-boundaries) + solution style tsconfig path groups.
5 Release Instability
- Mitigation: Use prerelease tags and canary builds via CI on main merges.
6 Auth Fragility
- Mitigation: Contract tests for session object (shared test-utils).
7 Role Permission Drift (frontend vs backend)
- Mitigation: Single package; backend no longer maintains copy.

Dependency Directions (Target Architecture)
config-* -> (none)
core-types <- roles-permissions <- domain (level/xp/rp, currency) <- react-contexts/react-hooks <- apps
core-schemas -> backend models, (types only to frontend)
auth-shared -> api-client -> apps
utils -> all layers

Suggested Package Build Tooling
- tsup (fast dual ESM/CJS if needed; or ESM-only)
- declaration + sourcemaps
- exports field per entrypoint (types-only subpath: "./types")
- Each package: "type": "module" (consistent)

Naming & Conventions
- Scope: @eureka/<kebab-name>
- Keep pure logic packages framework-agnostic (no React, no Next).
- React-specific packages: suffix with react- (react-hooks, react-contexts)
- Avoid “shared” generic naming except for @eureka/auth-shared (narrow meaning)

Initial Turborepo pipeline (example)
"pipeline": {
  "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "lint": {},
  "typecheck": { "dependsOn": ["^typecheck"] },
  "dev": { "cache": false }
}

Tooling Recommendations
- pnpm workspaces
- Turborepo (caching builds/tests)
- Changesets for versioning & release notes
- ESLint flat config with layered import constraints
- Zod for schema runtime validation
- tsup for builds
- Commit lint + conventional commits (semantic-release optional or keep manual via Changesets)
- Storybook (later) for ui-primitives

Immediate Action Checklist (First 2 Weeks)
1 Add pnpm-workspace.yaml & turbo
2 Install Changesets; initialize
3 Extract @eureka/utils (copy + adjust imports)
4 Extract @eureka/core-types
5 Extract @eureka/roles-permissions (move role-validation + enums)
6 Refactor backend + frontend imports to new packages
7 Introduce zod in core-schemas (types only first)
8 Add layered import lint rules

Open Questions (Resolve Early)
- Need runtime validation library preference? (zod assumed)
- Do we require CJS compatibility? (If Node >=18 & Next/Nest ESM capable, stay ESM-only)
- Will backend become multiple services soon? (Impacts how granular DTO packages should be)
- Do we need theme/token system (ui-primitives) before multi-portal split? (If yes, raise its priority)

Summary Priority (Top 5)
1 core-schemas
2 roles-permissions
3 core-types
4 auth-shared
5 utils

If you want, next step: I can draft pnpm-workspace.yaml + initial package.json scaffolds.

Provide confirmation to proceed with scaffolding or adjust package list.