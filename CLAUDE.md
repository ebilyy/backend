# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # watch mode (needs Postgres and Garage running)
npm run build              # nest build -> dist/
npm run lint               # eslint --fix over src, test
npm run format             # prettier over src, test

npm test                   # jest, rootDir=src, *.spec.ts
npx jest src/modules/suppliers/services/suppliers.service.spec.ts   # single file
npx jest -t "should be defined"                                     # single test by name
npm run test:e2e           # jest --config ./test/jest-e2e.json (test/*.e2e-spec.ts)

npm run db:up              # docker compose up -d postgres garage
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

NestJS 11 + TypeORM + Postgres. Feature modules live in `src/modules/<feature>/` and are re-exported from `src/modules/index.ts`; cross-cutting helpers live in `src/common/`, infrastructure wiring in `src/infrastructure/`. `FilesModule` holds the file storage and the `file_uploads` upload/list endpoints (see below).

### Layering inside a feature module

`controllers/` → `services/` → `repositories/` → entity. `SuppliersModule` is the reference implementation; copy its shape for new features.

- **Repository** extends TypeORM's `Repository<T>` directly and is constructed from `DataSource.createEntityManager()`, then provided as a plain class (not `getRepositoryToken`). Query building — `where`, `order`, `skip/take`, `withDeleted` — belongs here.
- **Service** holds business rules and throws HTTP exceptions (`NotFoundException`, `ConflictException`). It composes repository calls; e.g. `update` re-reads via `findOne` so the caller gets the fresh row, and `delete` soft-deletes then returns the row with `withDeleted: true`.
- **Controller** is thin: it wires pipes, Swagger decorators, and delegates.

### Validation: class-validator DTO classes

Request shapes are classes in `dto/` decorated with `class-validator` rules, `class-transformer` transforms and `@ApiProperty` for Swagger. DTOs must be imported as values, never with `import type`: `emitDecoratorMetadata` needs the class reference at runtime, otherwise the pipe sees `Object` and validates nothing.

- `AppValidationPipe` (`src/common/pipes/validation.pipe.ts`) is registered globally via `APP_PIPE` in `AppModule` (not `app.useGlobalPipes`, so e2e tests built from `AppModule` get it too). It runs with `transform: true` (controllers receive DTO instances with transforms and field defaults applied) and `whitelist: true` (undecorated keys are stripped), and turns errors into a 400 listing `{ field, message }` — `fieldErrorsException()` builds that shape for other pipes.
- Transforms run before validation, so normalisation goes in `@Trim()` / `@ToLowerCase()` (`src/common/decorators/`) and validators see the cleaned value. Query numbers need `@Type(() => Number)`; defaults are field initializers (see `PaginationQueryDto`).
- Swagger reads the body/query DTO classes directly, so docs details (`description`, `example`, `format`, `minLength`/`maxLength`) go into `@ApiProperty` next to the validators. Response schemas come from `@ApiProperty` on the **entity** class, which doubles as the Swagger response model (`@ApiOkResponse({ type: Supplier })`).
- Update DTOs are `PartialType(CreateDto, { skipNullProperties: false })` from `@nestjs/swagger` (carries over validators, transforms and docs). `skipNullProperties: false` makes optional fields skip only `undefined`, so `null` in a NOT NULL column is a 400 rather than a DB error. Empty PATCH bodies are rejected by `@Body(NonEmptyBodyPipe)`.

Adding a field therefore touches: the create DTO (validators + `@ApiProperty`), the entity column (with `@ApiProperty`), and a generated migration.

### Pagination

`src/common/pagination/` is the single implementation: `PaginationQueryDto` (`page`/`limit` converted from query strings with `@Type(() => Number)`, `limit` capped at `MAX_LIMIT = 100`) → `toSkipTake()` in the repository → `findAndCount` → `paginate()` wraps the tuple into `{ items, meta }`. Docs come from the `@ApiPaginatedResponse(Entity)` decorator, which builds the schema by hand with `$ref` because generics are erased at runtime. List queries must always specify an `order` or pages will be unstable.

### Entities and soft delete

Every entity extends `AbstractEntity` (`src/common/entity/abstract.entity.ts`): auto-increment `id` plus `created_at`/`updated_at`/`deleted_at` as `timestamptz`. Columns are explicitly named in snake_case while properties are camelCase — keep that convention. Deletes are soft (`@DeleteDateColumn` + `softDelete`), so repository lookups take an `includeDeleted` flag and uniqueness checks must search with `withDeleted: true` (a deleted row still occupies its unique email).

### Database configuration

`buildDataSourceOptions(get)` in `src/infrastructure/database/database.config.ts` is the one source of DB options, consumed by both `DatabaseModule` (through `ConfigService`, with `autoLoadEntities: true`) and `data-source.ts` (the TypeORM CLI, which loads `.env` itself via `dotenv` since it runs outside Nest DI). Change options there, never in one of the two consumers.

`synchronize` defaults to false — schema changes go through migrations only. In `docker-compose.yml` the `api` service overrides `DB_HOST=postgres`, `POSTGRES_PORT=5432` (the host-side `POSTGRES_PORT=5444` is only a port mapping) and sets `DB_MIGRATIONS_RUN=true` so migrations run on container start. The image is built with `NODE_ENV=production`, where an empty `CORS_ORIGINS` disables CORS entirely, so compose defaults `CORS_ORIGINS` to `http://localhost:5173` (the Vite front).

### File storage (Garage, S3)

File bytes live in [Garage](https://garagehq.deuxfleurs.fr), an S3-compatible store: the `garage` service in `docker-compose.yml` locally, a Coolify one-click service in prod. `FilesStorageService` (`src/modules/files/storage/`) wraps `@aws-sdk/client-s3` and deals only in object keys (`put`/`get`/`delete`/`ping`); deciding keys and DB rows is the files services' job. Options come from `buildStorageOptions(get)` (`S3_*` env vars, defaults match the local Garage). `/health` pings the bucket, so the app reports unhealthy without storage.

- Garage creates its layout, access key and bucket itself on first start (`--single-node --default-bucket`, fed by `GARAGE_DEFAULT_*` = the app's `S3_*` values), so there is no init step.
- `put` goes through `Upload` from `@aws-sdk/lib-storage`, because `PutObjectCommand` needs the body length up front and multipart uploads arrive as streams without it.
- S3 has no rename: write under a fresh key, commit the DB row, then delete the old object, rather than porting the PRD's tmp-file + rename steps.

Uploads: `POST /files` (multipart, repeated field `files`) and `GET /files` (paginated, newest first). Limits live in `files.constants.ts`: 10 MB per file, 10 files per request.

- `FilesUploadInterceptor` calls `multer` directly instead of Nest's `FilesInterceptor`, which turns multer errors into English messages and drops `error.code`. It also sets `defParamCharset: 'utf8'`, because multer's `latin1` default garbles Cyrillic filenames.
- Files are buffered in memory. That is acceptable at 10 × 10 MB, but raising the limits means switching to a streaming storage engine.
- A batch is all-or-nothing: `FilesService` writes every object, then saves all rows in one transaction, and on any failure deletes every key.
- `storage_key` is `select: false`, so it never reaches responses. A future download endpoint has to select it explicitly.
- No duplicate bytes: `content_hash` (SHA-256 hex, also `select: false`) has a unique index over all rows, soft-deleted included. Before anything is written, `FilesService` rejects the whole batch with 409 if a file matches an existing row or another file in the same request. A concurrent duplicate fails on the index at save time, and the batch cleanup removes its objects.

## Intents

New ideas, tickets and incidents are captured as `intent/<YYYY-MM-DD>-<slug>/intent.md` via the project skill `/capture-intent` (`.claude/skills/capture-intent/`). The matching `spec.md` goes in the same folder later.

## Conventions

- Code comments and user-facing error messages are written in Ukrainian; match that when editing existing files.
- Comments explain *why* (races, erased generics, unstable ordering), not what — keep that bar rather than narrating the code.
- Imports are relative (`../../../common/...`); no path aliases are configured.
