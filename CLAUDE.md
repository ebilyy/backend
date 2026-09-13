# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # watch mode (needs Postgres running)
npm run build              # nest build -> dist/
npm run lint               # eslint --fix over src, test
npm run format             # prettier over src, test

npm test                   # jest, rootDir=src, *.spec.ts
npx jest src/modules/suppliers/services/suppliers.service.spec.ts   # single file
npx jest -t "should be defined"                                     # single test by name
npm run test:e2e           # jest --config ./test/jest-e2e.json (test/*.e2e-spec.ts)

npm run db:up              # docker compose up -d postgres
npm run db:down            # docker compose down
```

Migrations (TypeORM CLI, `-d src/infrastructure/database/data-source.ts`):

```bash
npm run migration:generate -- src/infrastructure/database/migrations/AddSomething  # diff entities vs DB
npm run migration:create   -- src/infrastructure/database/migrations/AddSomething  # empty migration
npm run migration:run
npm run migration:revert
npm run migration:show
```

The app listens on `PORT` (`.env` sets 3008, code falls back to 3000). Swagger UI is at `/docs`, raw OpenAPI JSON at `/docs-json`. Copy `.env.example` to `.env` before first run.

## Architecture

NestJS 11 + TypeORM + Postgres. Feature modules live in `src/modules/<feature>/` and are re-exported from `src/modules/index.ts`; cross-cutting helpers live in `src/common/`, infrastructure wiring in `src/infrastructure/`. `FilesModule` is currently an empty placeholder.

### Layering inside a feature module

`controllers/` → `services/` → `repositories/` → entity. `SuppliersModule` is the reference implementation; copy its shape for new features.

- **Repository** extends TypeORM's `Repository<T>` directly and is constructed from `DataSource.createEntityManager()`, then provided as a plain class (not `getRepositoryToken`). Query building — `where`, `order`, `skip/take`, `withDeleted` — belongs here.
- **Service** holds business rules and throws HTTP exceptions (`NotFoundException`, `ConflictException`). It composes repository calls; e.g. `update` re-reads via `findOne` so the caller gets the fresh row, and `delete` soft-deletes then returns the row with `withDeleted: true`.
- **Controller** is thin: it wires pipes, Swagger decorators, and delegates.

### Validation and OpenAPI both come from Zod

There is no `class-validator`/`class-transformer`. Request shapes are Zod schemas in `dto/`, and the DTO "type" is `z.infer<typeof schema>` — so DTOs are types, not classes, and must be imported with `import type`.

- `ZodValidationPipe` (`src/common/pipes/zod-validation.pipe.ts`) is applied per-parameter — `@Body(new ZodValidationPipe(schema))`, `@Query(new ZodValidationPipe(schema))` — not as a global pipe. It returns parsed data (unknown keys stripped) or a 400 listing `{ field, message }`.
- `ApiZodBody` / `ApiZodQuery` (`src/common/swagger/zod-openapi.ts`) convert the *same* schema to OpenAPI via `z.toJSONSchema({ target: 'openapi-3.0', io: 'input', unrepresentable: 'any' })`. Because `unrepresentable: 'any'` drops things JSON Schema can't express and constraints behind `.pipe()` are lost, documentation details (`description`, `example`, `format`, `maxLength`) are attached with `.meta()` on the schema. See `create-supplier.dto.ts` for the pattern.
- Response schemas still come from `@ApiProperty` on the **entity** class, which doubles as the Swagger response model (`@ApiOkResponse({ type: Supplier })`).

Adding a field therefore touches: the Zod create schema (with `.meta()`), the entity column (with `@ApiProperty`), and a generated migration. The update schema derives from the create schema via `.partial().refine(...)` — the refine rejects an empty PATCH body.

### Pagination

`src/common/pagination/` is the single implementation: `paginationQuerySchema` (coerced `page`/`limit`, `limit` capped at `MAX_LIMIT = 100`) → `toSkipTake()` in the repository → `findAndCount` → `paginate()` wraps the tuple into `{ items, meta }`. Docs come from the `@ApiPaginatedResponse(Entity)` decorator, which builds the schema by hand with `$ref` because generics are erased at runtime. List queries must always specify an `order` or pages will be unstable.

### Entities and soft delete

Every entity extends `AbstractEntity` (`src/common/entity/abstract.entity.ts`): auto-increment `id` plus `created_at`/`updated_at`/`deleted_at` as `timestamptz`. Columns are explicitly named in snake_case while properties are camelCase — keep that convention. Deletes are soft (`@DeleteDateColumn` + `softDelete`), so repository lookups take an `includeDeleted` flag and uniqueness checks must search with `withDeleted: true` (a deleted row still occupies its unique email).

### Database configuration

`buildDataSourceOptions(get)` in `src/infrastructure/database/database.config.ts` is the one source of DB options, consumed by both `DatabaseModule` (through `ConfigService`, with `autoLoadEntities: true`) and `data-source.ts` (the TypeORM CLI, which loads `.env` itself via `dotenv` since it runs outside Nest DI). Change options there, never in one of the two consumers.

`synchronize` defaults to false — schema changes go through migrations only. In `docker-compose.yml` the `api` service overrides `DB_HOST=postgres`, `POSTGRES_PORT=5432` (the host-side `POSTGRES_PORT=5444` is only a port mapping) and sets `DB_MIGRATIONS_RUN=true` so migrations run on container start.

## Conventions

- Code comments and user-facing error messages are written in Ukrainian; match that when editing existing files.
- Comments explain *why* (races, erased generics, unstable ordering), not what — keep that bar rather than narrating the code.
- Imports are relative (`../../../common/...`); no path aliases are configured.
