# Project Guidelines

## Code Style
- Use TypeScript with strict typing and avoid `any` unless there is a documented, unavoidable boundary.
- Follow existing linting conventions from `.eslintrc.js` (`@pagopa/eslint-config/strong`).
- Keep source edits in `src/`; `lib/` and `docs/` are generated artifacts and should not be hand-edited.

## Architecture
- This package is a shared TypeScript utility library centered on `io-ts` runtime codecs and `fp-ts` functional types.
- Public exports are collected through `src/index.ts`; keep exports intentional and stable.
- Runtime source modules are in `src/`; compile output is generated in `lib/` by `tsc`.
- Type documentation is generated into `docs/` via TypeDoc.

## Build and Test
- Use Node version from `.node-version`.
- Install dependencies with `yarn install --immutable` (CI-compatible) or `yarn install --frozen-lockfile`.
- Build with `yarn build`.
- Run tests with `yarn test`.
- Run lint with `yarn lint`.
- Validate typings with `yarn check-typings`.
- Generate docs with `yarn docs`.

## Conventions
- Prefer `io-ts` codecs and `fp-ts` combinators (`Either`, `Option`, `TaskEither`) over ad-hoc validation and exception-driven flows.
- Preserve existing branded/tagged type patterns in modules such as `src/types.ts` and `src/strings.ts`.
- Keep test files under `src/__tests__/` and follow existing module-focused test organization.

## Pitfalls
- `yarn test` already sets `NODE_TLS_REJECT_UNAUTHORIZED=0`; do not remove it unless test fixtures are updated accordingly.
- GitHub Actions references `yarn test:coverage`; verify CI-related script changes against `.github/workflows/code-review.yaml`.

## References
- Setup and contribution guidance: `README.md`
- Scripts and Jest configuration: `package.json`
- TypeScript compiler settings: `tsconfig.json`
- CI workflows: `.github/workflows/code-review.yaml`, `.github/workflows/release.yaml`
- PR checklist and contribution expectations: `.github/PULL_REQUEST_TEMPLATE.md`