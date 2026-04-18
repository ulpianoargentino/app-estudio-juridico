# Auditoría App Jurídica — 2026-04-16

> Reporte de estado del repo contra las reglas de [CLAUDE.md](CLAUDE.md). No incluye implementaciones: solo relevamiento.

## Actualización 2026-04-17 — Tarea D1 (Módulo Expedientes)

Cambios aplicados después de la foto del 2026-04-16:

- **`caseStatus` unificado a 15 valores** (antes 10 + la idea de `procedural_stages` aparte). Nuevos valores: `AWAITING_INTERLOCUTORY`, `ON_APPEAL`, `FINAL_JUDGMENT`, `INCIDENT`, `EXPIRED`, `CLOSED`. Se eliminó `ARCHIVED` del enum — el "archivo" se representa con `is_active = false` en la columna existente, no como un estado procesal.
- **Archive / Unarchive** reemplaza al `softDelete`: `POST /api/cases/:id/archive` + `POST /api/cases/:id/unarchive`. `DELETE /api/cases/:id` sigue mapeado a archive (no hay hard delete).
- **Módulo Cases — UI completa**: listado con tabs `En Trámite` / `Archivados` ([frontend/src/pages/cases/index.tsx](frontend/src/pages/cases/index.tsx)), detalle con sub-tabs, formulario page-route (`/cases/new` y `/cases/:id/edit`).
- **Selectors con inline-create**: `PersonSelect` y el nuevo `CourtSelect` exponen `allowCreate` para abrir el form-dialog del dominio y auto-seleccionar el registro recién creado. `PersonSelect` sin `allowCreate` conserva el comportamiento anterior.
- **`@radix-ui/react-tabs`** instalado + wrapper shadcn en [frontend/src/components/ui/tabs.tsx](frontend/src/components/ui/tabs.tsx).

Las filas afectadas del inventario de abajo (módulo #2 Expedientes, módulo #6 Juzgados, C1 #1) quedan marcadas como actualizadas en línea.

## Nota preliminar — Documentos de referencia

De los 5 documentos pedidos, **solo 2 existen en la raíz del repo**:

| Documento | Estado |
|---|---|
| `CLAUDE.md` | ✅ Presente |
| `README.md` | ✅ Presente (muy corto — 30 líneas) |
| `SPEC_APP_JURIDICA_v1.md` | ❌ **No existe en el repo** |
| `ARQUITECTURA_APP_JURIDICA_v1.md` | ❌ **No existe en el repo** |
| `CONTEXTO_MERCADO_APP_JURIDICA_v1.md` | ❌ **No existe en el repo** |

Tampoco los encontré en ninguna otra carpeta del proyecto (`Glob **/SPEC*.md`, `**/ARQUITECTURA*.md`, `**/CONTEXTO*.md` — sin resultados).

**Impacto sobre la auditoría:**
- La sección 7 del SPEC que el pedido referencia ("10 funcionalidades del MVP") no existe como archivo — reconstruí el MVP a partir de la navegación del sidebar, los 15 modelos ya definidos y el stack declarado en CLAUDE.md (módulos 1–13 del pedido).
- La Parte C1 usa esa reconstrucción. Si hay funcionalidades que el SPEC menciona y no aparecen en el código ni en el sidebar (por ejemplo, reportes avanzados o alertas de caducidad específicas), no las pude evaluar — quedan fuera de esta auditoría.
- Recomiendo bajar los docs al repo o indicar dónde están, para que una próxima auditoría sea fiel al SPEC.

---

## Parte A — Inventario del código actual

### A1. Mapa de archivos por carpeta

**Raíz del repo:**
- `CLAUDE.md`, `README.md`, `.env`, `.env.example`, `.gitignore`
- `backend/`, `frontend/`, `database/`

**`backend/` — ~49 archivos `.ts`**
- `drizzle/` → una migración (`0000_pretty_kinsey_walden.sql`) + `meta/` (snapshot auto-generado)
- `drizzle.config.ts`, `package.json`, `tsconfig.json`
- `src/` organizado así:
  - `models/` (16 archivos) — schemas Drizzle de cada tabla + `enums.ts` + `index.ts` barrel
  - `services/` (6 archivos) — lógica de negocio: auth, person, court, case, matter, party
  - `controllers/` (6 archivos) — handlers HTTP para los mismos 6 dominios
  - `routes/` (6 archivos) — router por dominio + `index.ts` que los monta
  - `validators/` (5 archivos) — schemas Zod de validación
  - `middleware/` (4 archivos) — auth, authorize, firm-context, error-handler
  - `types/` (2 archivos) — `express.ts` (extiende Request) + `index.ts`
  - `utils/` (1 archivo) — `uuid.ts` (UUIDv7)
  - `config/index.ts`, `db.ts`, `index.ts`
  - **`ai-service/index.ts`** — stub único
  - **`portal-scraper/index.ts`** — stub único

**`frontend/` — ~38 archivos `.tsx/.ts`**
- `components.json` (config de shadcn/ui), `index.html`, `vite.config.ts`, `package.json`
- `src/`:
  - `pages/` (4 archivos) — login, register, dashboard, placeholder
  - `components/layout/` (3 archivos) — app-layout, header, sidebar
  - `components/ui/` (18 archivos) — wrappers shadcn + custom (data-table, pagination, status-badge, person-select, form-field, search-input, page-header, confirm-dialog, etc.)
  - `components/protected-route.tsx`
  - `contexts/` — auth-context, theme-context
  - `hooks/` — use-mobile
  - `i18n/es.ts` — un solo archivo de traducciones
  - `lib/utils.ts`, `main.tsx`, `App.tsx`
  - `services/` — `api.ts` (axios client), `auth.service.ts`
  - `types/index.ts` — tipos del dominio (ver B3, está desalineado)

**`database/`** — solo un `.gitkeep`. **Vacía**: todas las migraciones están en `backend/drizzle/`, no acá. Anomalía menor: CLAUDE.md indica que `database/` contiene "Migraciones y seeds", pero están en `backend/drizzle/`. No es grave; hay que decidir si mover las migraciones a `database/` o actualizar CLAUDE.md.

**Anomalías estructurales:**
- La carpeta `database/` está vacía — drift con CLAUDE.md.
- No hay `frontend/src/hooks/` poblado (solo `use-mobile`) ni `frontend/src/services/` por dominio: axios está ahí pero no hay `case.service.ts`, `person.service.ts`, etc., en el frontend.

---

### A2. Stack real vs. stack declarado

| Capa | Declarado (CLAUDE.md) | Real (código) | Comentario |
|---|---|---|---|
| Backend framework | No especificado | **Express 4.21** | Pendiente en CLAUDE.md, decidido en el código |
| ORM | "Prisma o Drizzle" | **Drizzle 0.45** + `drizzle-kit 0.31` | Decisión tomada: Drizzle |
| Driver PG | - | **`postgres` 3.4 (postgres-js)** | - |
| Auth | JWT o sesiones | **JWT** en cookies httpOnly + `bcrypt` 6 | Decisión tomada: JWT |
| Validación | No especificado | **Zod v4** (via `zod/v4` import) | - |
| Middleware seguridad | - | `helmet`, `cors`, `cookie-parser` | OK |
| Frontend framework | React + TS | **React 19** + Vite 6 + TS 5.7 | OK |
| Librería UI | "probablemente shadcn/ui" | **shadcn/ui** (Radix + class-variance-authority) | Confirmada — `components.json` presente |
| CSS | No especificado | **Tailwind v4** | - |
| Cliente HTTP | - | **axios 1.14** con interceptor | OK |
| Estado server | - | **TanStack Query v5** instalado | Instalado pero NO usado aún (no hay features de datos) |
| Estado cliente | - | **Zustand 5** instalado | Instalado pero NO usado: auth vive en Context, no en store |
| Editor texto rico | "probablemente TipTap" | **Ninguno instalado** | Decisión PENDIENTE |
| Cliente Anthropic | API de Claude | **`@anthropic-ai/sdk` NO está en dependencies** | Decisión pendiente / ai-service vacío |
| Almacenamiento S3 | Compatible S3 | **Ningún SDK instalado** (ni `aws-sdk`, ni `@aws-sdk/*`, ni `minio`) | Solo env vars definidas |
| Hosting | - | No resuelto | - |

**Decisiones YA tomadas (aunque CLAUDE.md no lo refleje):**
- Framework backend: Express
- ORM: Drizzle
- Estrategia de IDs: UUIDv7 via `text` columns (ver `utils/uuid.ts`)
- Librería UI: shadcn/ui
- Auth: JWT en cookie httpOnly
- Validación: Zod v4

**Decisiones todavía pendientes:**
- Editor de texto rico (ej. TipTap) — necesario para Templates/Escritos
- SDK de almacenamiento S3 — necesario para Documents
- **Cliente Anthropic** — ni instalado ni importado
- Proveedor de hosting
- Librería de scraping (Playwright vs. Puppeteer vs. crawlee) — necesaria para portal-scraper

**Dependencias sospechosas o inesperadas:**
- `zustand` instalado pero no usado en ningún lugar del código actual — desperdicia bundle size. Aceptable si está previsto para futuras features, pero suma ruido.
- `@tanstack/react-query` instalado pero no usado en ningún query real. El provider está en [App.tsx:12](frontend/src/App.tsx:12) pero no hay hooks de datos.

---

### A3. Base de datos — schema y multi-tenancy

**Ubicación real:** [backend/src/models/](backend/src/models/) (schema Drizzle) + [backend/drizzle/0000_pretty_kinsey_walden.sql](backend/drizzle/0000_pretty_kinsey_walden.sql) (migración generada).

**Migraciones:** 1 migración generada. `_journal.json` + `0000_snapshot.json` en `backend/drizzle/meta/`. **No hay seeds**.

**Tablas definidas (15):**

| # | Tabla | `firm_id` | `created_by` | `created_at` | `updated_by` | `updated_at` | Notas |
|---|---|---|---|---|---|---|---|
| 1 | `firms` | — (raíz tenant) | ❌ | ✅ | ❌ | ✅ | OK: tabla raíz no requiere FK a sí misma |
| 2 | `users` | ✅ | ❌ | ✅ | ❌ | ✅ | Auto-referencia omitida. Defendible |
| 3 | `persons` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 4 | `courts` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 5 | `cases` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 6 | `matters` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 7 | `parties` | ✅ | ✅ | ✅ | ✅ | ✅ | OK. Check constraint XOR case/matter correcta |
| 8 | `movements` | ✅ | ✅ | ✅ | ✅ | ✅ | OK. Check constraint XOR case/matter correcta |
| 9 | `errands` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 10 | `events` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 11 | `documents` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 12 | `templates` | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| 13 | `notifications` | ✅ | ❌ | ✅ | ❌ | ❌ | **Violación**: falta `updated_at`, `created_by`, `updated_by` |
| 14 | `case_links` | ✅ | ✅ | ✅ | ❌ | ❌ | **Violación parcial**: faltan `updated_by`/`updated_at` |
| 15 | `portal_credentials` | ✅ | ❌ | ✅ | ❌ | ✅ | **Violación**: faltan `created_by`, `updated_by` |

**Multi-tenancy:** TODAS las 14 tablas de datos de usuario tienen `firm_id` con FK a `firms.id` — ✅ cumple CLAUDE.md. `firms` es la raíz, correcto que no lo tenga.

**Auditoría en services:** los 6 services (auth, person, court, case, matter, party) filtran por `firmId` en cada query — verificado en lecturas y escrituras. Ejemplo: [backend/src/services/person.service.ts:78-134](backend/src/services/person.service.ts) siempre usa `eq(persons.firmId, firmId)`. No encontré ninguna consulta sin filtro.

**Campos de auditoría — violaciones a corregir:**
- `notifications`: agregar `updated_by`, `updated_at` (y decidir si `created_by` tiene sentido — una notificación puede ser creada por el sistema).
- `case_links`: agregar `updated_by`, `updated_at`.
- `portal_credentials`: agregar `created_by`, `updated_by`.

**Hallazgos adicionales:**
- Claves primarias: `text` con UUIDv7 ([backend/src/utils/uuid.ts](backend/src/utils/uuid.ts)) — OK y razonable.
- Enums guardados como `text` + validación Zod a nivel app, en lugar de `pgEnum`. Decisión consciente (comentada en [backend/src/models/enums.ts:2](backend/src/models/enums.ts:2)): flexibilidad. Trade-off: la base no impide valores inválidos si alguien inserta por fuera del service layer.
- Timestamps usan `{ withTimezone: true }` y `defaultNow()` — cumple "todas las fechas en UTC" de CLAUDE.md.

---

### A4. Estado end-to-end de los módulos del MVP

Notación: **COMPLETO** / **BACKEND COMPLETO** (sin UI) / **SOLO SCHEMA** / **STUB/VACÍO** / **SIN EMPEZAR**.

| # | Módulo | Estado | Explicación |
|---|---|---|---|
| 1 | Autenticación + Firms + Users | **COMPLETO** | Backend (service+controller+routes), UI (login+register+protected-route+auth-context). Cookies httpOnly, JWT 7 días. [auth.service.ts](backend/src/services/auth.service.ts) |
| 2 | Expedientes (Cases) | **COMPLETO (2026-04-17)** | Backend CRUD + archive/unarchive + summary. UI en [frontend/src/pages/cases/](frontend/src/pages/cases/): listado con tabs `En Trámite` / `Archivados`, form page en `/cases/new` y `/cases/:id/edit`, detalle con sub-tabs. `caseStatus` ampliado a 15 valores |
| 3 | Otros Casos (Matters) | **BACKEND COMPLETO** | Igual que cases + endpoint `/convert` que crea Case y copia parties, movements, documents, events (transaccional — [matter.service.ts:214-305](backend/src/services/matter.service.ts)). **UI: placeholder** |
| 4 | Directorio de Personas | **BACKEND COMPLETO** | CRUD + `/search` para autocompletar. **UI: placeholder**. Existe `PersonSelect` ([person-select.tsx](frontend/src/components/ui/person-select.tsx)) listo para usarse en forms |
| 5 | Partes (Parties) | **BACKEND COMPLETO** | Sub-rutas `/:caseId/parties` y `/:matterId/parties` con add/remove/list. Valida duplicados y pertenencia al firm. **UI: nada** |
| 6 | Juzgados (Courts) | **BACKEND COMPLETO + UI parcial (2026-04-17)** | CRUD backend. UI parcial: `CourtSelect` + `CourtFormDialog` para crear desde el form de expediente ([courts/court-form-dialog.tsx](frontend/src/pages/courts/court-form-dialog.tsx)). Falta la página CRUD dedicada `/courts` |
| 7 | Agenda y Eventos | **SOLO SCHEMA** | Tabla `events` definida ([events.ts](backend/src/models/events.ts)) pero **sin service, sin controller, sin route, sin UI**. CLAUDE.md §6 exige auto-agendar audiencias cuando se registra prueba — no implementado |
| 8 | Movimientos / Actuaciones | **SOLO SCHEMA** | Tabla `movements` definida con check constraint XOR, pero sin service/controller/route/UI. Lo usa `case.service.findById` solo como `count()` |
| 9 | Gestiones de Procuración (Errands) | **SOLO SCHEMA** | Tabla definida, resto vacío |
| 10 | Gestión Documental (Documents) | **SOLO SCHEMA** | Tabla definida con FK a case/matter/movement. **Ningún SDK de storage S3 instalado.** Sin service/controller/route/UI |
| 11 | Plantillas de Escritos (Templates) | **SOLO SCHEMA** | Tabla definida con `content text`, `variables jsonb`. Sin nada más. No hay editor rich-text (TipTap no está instalado) |
| 12 | Case links | **SOLO SCHEMA** | Tabla definida, resto nada |
| 13 | Notificaciones | **SOLO SCHEMA** | Tabla definida, sin endpoints, sin campana funcional (hay `<Bell/>` en el header pero sin datos — [header.tsx:41-45](frontend/src/components/layout/header.tsx:41)) |
| 14 | Portal credentials | **SOLO SCHEMA** | Tabla con `username_encrypted`/`password_encrypted`. **No hay código de encriptación en el repo** (ver A5) |
| 15 | Reportes / Estadísticas | **SIN EMPEZAR** | Solo existe `case.service.getCaseSummary()` — agrega cases por status. Único endpoint "report-like". Sin UI |
| 16 | Consulta de Portales Judiciales | **STUB/VACÍO** | [portal-scraper/index.ts](backend/src/portal-scraper/index.ts) — 2 métodos que hacen `throw new Error("Not implemented")` |
| 17 | Asistente de IA | **STUB/VACÍO** | [ai-service/index.ts](backend/src/ai-service/index.ts) — 6 métodos que hacen `throw new Error("Not implemented")` |

**UI del frontend más allá del login:** Solo [dashboard.tsx](frontend/src/pages/dashboard.tsx) existe, y es 15 líneas que muestran "Bienvenido, {firstName}". Todas las demás rutas (`/cases`, `/matters`, `/persons`, `/calendar`, `/filings`, `/reports`, `/settings`) renderizan `PlaceholderPage` con texto "Próximamente" ([placeholder.tsx](frontend/src/pages/placeholder.tsx)).

---

### A5. Los 2 diferenciadores del producto

#### ai-service/

- **Existe la carpeta:** Sí, [backend/src/ai-service/](backend/src/ai-service/). Un solo archivo `index.ts` (51 líneas).
- **Las 6 funciones de negocio del CLAUDE.md están definidas:**
  - `generateFiling(caseData, templateId, filingType)` — línea 7
  - `analyzeDocument(documentContent)` — línea 17
  - `searchJurisprudence(query)` — línea 23
  - `suggestNextSteps(caseData)` — línea 29
  - `alertExpiration(caseData)` — línea 35
  - `contextualChat(message, caseContext)` — línea 41
- **Cada una hace:** `throw new Error("Not implemented: …")`. **Ninguna** llama a Anthropic, ninguna devuelve mock.
- **SDK Anthropic:** **NO instalado**. `@anthropic-ai/sdk` NO está en `backend/package.json` ni en `package-lock.json`. La única referencia a "anthropic" es la env var `ANTHROPIC_API_KEY` en [config/index.ts:16](backend/src/config/index.ts:16) y en `.env.example`.
- **Tools para DB (`searchCases`, `getCaseDetail`, etc.):** **Ninguna implementada.** No hay un framework de tool-calling, ni siquiera una interfaz.

**Veredicto ai-service:** esqueleto de interfaz, 0% implementado. No hay ni siquiera un "hello world" contra la API de Claude.

#### portal-scraper/

- **Existe la carpeta:** Sí, [backend/src/portal-scraper/](backend/src/portal-scraper/). Un solo `index.ts` (30 líneas).
- **Código real de scraping:** **Cero**. Dos métodos (`scrapePortal`, `checkForUpdates`) con `throw new Error`. Sin librería de scraping instalada (sin `playwright`, sin `puppeteer`, sin `cheerio`).
- **Portales contemplados vs. Fase 1:**
  - En `enums.ts`: `MEV_BUENOS_AIRES` y `SAE_TUCUMAN` — coinciden con Fase 1 ✅
  - En `portal-scraper/index.ts`: comentarios TODO mencionan MEV y Portal del SAE ✅
  - Tabla `portal_credentials` con columna `portal` que acepta esos dos valores ✅
- **Credenciales:** columnas `username_encrypted` y `password_encrypted` en tabla `portal_credentials`, pero **no hay ninguna librería o módulo de encriptación en el código**. No se hace referencia a `crypto`, `node-forge`, ni hay una `encryption-key` en config. Hoy, insertar credenciales guardaría strings en claro en columnas llamadas "_encrypted".

**Veredicto portal-scraper:** esqueleto conceptual, 0% implementado. La encriptación de credenciales (marcada como requisito de seguridad en CLAUDE.md) **no existe en el código**.

---

## Parte B — Convenciones y calidad

### B1. Idioma (según CLAUDE.md)

- **Código en inglés:** ✅ Cumple. Tablas (`cases`, `persons`, `matters`), columnas (`case_title`, `jurisdiction_type`), variables, funciones, endpoints (`/api/cases`, `/api/matters/:id/convert`). Nada en español en nombres técnicos.
- **UI en español vía i18n:** ✅ Cumple en general. `frontend/src/i18n/es.ts` concentra las traducciones. Los componentes que revisé (`login`, `register`, `dashboard`, `placeholder`, `sidebar`, `header`, `data-table`, `pagination`, `search-input`, `confirm-dialog`, `person-select`, `page-header`) usan `es.X.Y` — no hay strings españoles inline.
- **Strings hardcodeados en español en componentes:** busqué palabras típicas ("Buscar", "Guardar", "Cancelar", "Eliminar", "Crear", etc.) en `frontend/src/components/` — **no encontré ninguno fuera de `es.ts`**. Hay dos casos borderline que conviene reportar:
  1. [components/ui/status-badge.tsx:30-47](frontend/src/components/ui/status-badge.tsx:30) — `statusLabelMap` con strings hardcodeados en español ("Inicio", "En trámite", "Para sentencia", "Archivado", "Paralizado", etc.). No viola la regla técnicamente (son mapeos enum→label, no texto de UI libre), pero rompe la convención de centralizar en `es.ts`. Sugerencia: mover a `es.caseStatus.INITIAL` etc.
  2. Mensajes de error del backend van en español en los validators Zod (`"Fuero inválido"`, `"La carátula es obligatoria"`). Eso está **bien** — son mensajes para el usuario final — pero CLAUDE.md dice "comentarios que explican el *qué* en inglés". Los mensajes de error no son comentarios, así que está OK.
- **Comentarios del código:** mezclan inglés y español. Ejemplos:
  - [backend/src/models/parties.ts:25](backend/src/models/parties.ts:25): `// Exactamente uno de case_id o matter_id debe ser NOT NULL` (español — es un "por qué" / invariante, cumple)
  - [backend/src/models/enums.ts:1-2](backend/src/models/enums.ts:1): comentario en inglés explicando el diseño técnico — cumple
  - Consistente con CLAUDE.md.

**Muestra de hardcodeados encontrados (solo `status-badge.tsx`):**
```
30:  INITIAL: "Inicio",
31:  IN_PROGRESS: "En trámite",
34:  AWAITING_JUDGMENT: "Para sentencia",
38:  ARCHIVED: "Archivado",
39:  SUSPENDED: "Paralizado",
```

### B2. Tests, linter, CI

- **Tests:** **Cero**. No hay archivos `.test.ts`, `.spec.ts`, `.test.tsx`. Sin carpeta `__tests__/`. Sin `vitest`/`jest`/`mocha` en `package.json`. Sin script `test` en ninguno de los dos `package.json`.
- **Linter:** **Ninguno**. Sin `.eslintrc*`, sin `biome.json`, sin `.prettierrc*`. Los `package.json` no incluyen ESLint/Prettier/Biome/typescript-eslint.
- **CI:** **Ninguno**. No existe la carpeta `.github/`. Sin workflows.
- **Pre-commit hooks:** **Ninguno**. No existe `.husky/` ni `.lefthook.yml`. No hay `lint-staged`.

Todos los puntos de B2 están a nivel cero. Viable para pre-MVP; insostenible si el código escala.

### B3. Drift entre frontend y backend

- **`frontend/src/types/`:** existe, un solo archivo `index.ts` con enums e interfaces.
- **Mecanismo de sincronización:** **Ninguno**. No hay paquete compartido (`@app/shared`), no hay script de generación (ej. tRPC, OpenAPI codegen). Los tipos están copiados manualmente, y ya divergieron.

**Comparación de `Case` (entidad representativa):**

| Campo | Backend ([models/cases.ts](backend/src/models/cases.ts)) | Frontend ([types/index.ts](frontend/src/types/index.ts)) | Estado |
|---|---|---|---|
| id | ✅ | ✅ | OK |
| firmId | ✅ | ✅ | OK |
| caseNumber | ✅ `text` (nullable) | ✅ `string` (no-null) | **Tipo mismatch**: backend permite null, frontend no |
| caseTitle | ✅ | ✅ | OK |
| jurisdictionType | ✅ | ✅ | OK |
| jurisdiction | ✅ | ❌ falta | **Falta en frontend** |
| courtId | ✅ | ✅ | OK (ambos nullable) |
| processType | ✅ | ❌ falta | **Falta en frontend** |
| status | ✅ | ✅ | OK |
| primaryClientId | ✅ | ❌ falta | **Falta en frontend** |
| responsibleAttorneyId | ✅ | ❌ falta | **Falta en frontend** |
| startDate | ✅ | ❌ falta | **Falta en frontend** |
| claimedAmount | ✅ `numeric` | ❌ falta | **Falta en frontend** |
| currency | ✅ (default "ARS") | ❌ falta | **Falta en frontend** |
| portalUrl | ✅ | ❌ falta | **Falta en frontend** |
| notes | ✅ | ❌ falta | **Falta en frontend** |
| isActive | ✅ | ❌ falta | **Falta en frontend** |
| created_by/at, updated_by/at | ✅ | ✅ | OK |

**Conclusión:** el tipo `Case` del frontend refleja una versión muy anterior del schema. **Le faltan 9 campos** sobre 20. Si se intenta construir la UI de `/cases` con estos tipos, habrá que rehacerlos antes.

**Otras entidades que también están desalineadas:**

- **`Matter`** (frontend [types/index.ts:77-87](frontend/src/types/index.ts:77)): tiene `description: string | null` (campo que **no existe** en el schema backend). Le faltan `matterType`, `primaryClientId`, `opposingPartyId`, `responsibleAttorneyId`, `startDate`, `estimatedFee`, `currency`, `notes`, `convertedToCaseId`, `isActive`.
- **`Person`** (frontend [types/index.ts:89-100](frontend/src/types/index.ts:89)): le falta `personType`, `businessName`, `cuitCuil`, `mobilePhone`, toda la dirección (`addressStreet/City/State/Zip`), `legalAddress`, `appointedAddress`, `notes`, `isActive`.
- **`Movement`** (frontend [types/index.ts:102-114](frontend/src/types/index.ts:102)): tiene `title`, `description`, `occurredAt`. El backend tiene `movementDate`, `movementType`, `description`, `volume`, `folio`, `documentUrl`. **No coincide ningún campo** salvo `description`.
- **`Event`** (frontend [types/index.ts:116-130](frontend/src/types/index.ts:116)): tiene `startsAt`, `endsAt`, `isDeadline`. El backend tiene `eventType`, `eventDate`, `eventTime`, `endDate`, `endTime`, `isAllDay`, `assignedToId`, `status`, `reminderMinutesBefore`. **Diverge totalmente.**

El tipado del frontend está roto para todo lo que no sea auth. Antes de construir UI de datos, hay que regenerarlo.

---

## Parte C — Comparación contra roadmap del MVP

### C1. Cobertura del MVP

**Advertencia:** sin el SPEC, esta tabla la reconstruí a partir del sidebar + los 15 modelos + CLAUDE.md. Si el SPEC menciona funcionalidades que no aparecen acá, no las pude auditar.

| # | Funcionalidad MVP | Estado | % estimado | Bloqueadores |
|---|---|---|---|---|
| 1 | Gestión de Expedientes + Otros Casos | **CASES COMPLETO (2026-04-17) / MATTERS UI 0%** | 75% | Cases: listado + detalle + form + archive/unarchive. Falta búsqueda/filtros/paginación en listado (D3), sub-casos (D2) y la UI de Matters |
| 2 | Directorio de Personas | **BACKEND COMPLETO / UI 0%** | 50% | `/persons` es placeholder. `PersonSelect` ya está, pero no hay CRUD UI |
| 3 | Partes / Vínculos persona-expediente | **BACKEND COMPLETO / UI 0%** | 50% | Endpoints listos. Sin UI de vinculación dentro de la vista detalle |
| 4 | Agenda y eventos | **SOLO SCHEMA** | 10% | Faltan service, controller, route, UI. Regla de auto-agendar audiencias (CLAUDE.md §6) no implementada |
| 5 | Movimientos / Actuaciones | **SOLO SCHEMA** | 10% | Ídem. Columna `folio integer` y `volume` listas pero nada consume eso |
| 6 | Gestiones de Procuración | **SOLO SCHEMA** | 10% | Ídem |
| 7 | Gestión documental / adjuntos | **SOLO SCHEMA** | 5% | Ídem + **no hay SDK de S3 / MinIO / R2 instalado**, no hay decisión de provider, no hay endpoint de upload/presign |
| 8 | Plantillas de Escritos | **SOLO SCHEMA** | 5% | Ídem + **no hay editor rich-text instalado** (TipTap sigue pendiente) + las "variables" de plantilla no tienen motor de reemplazo |
| 9 | Reportes / Estadísticas | **SIN EMPEZAR** | 5% | Solo hay `getCaseSummary` (por status). Sin UI `/reports` |
| 10 | Asistente de IA | **STUB** | 2% | `ai-service` son 6 stubs. SDK Anthropic NO instalado. Sin tools de DB. Botón `<Bot/>` en header no hace nada |
| 11 | Consulta de Portales Judiciales | **STUB** | 2% | `portal-scraper` son 2 stubs. Sin librería de scraping instalada. **Encriptación de credenciales no implementada** — columnas llamadas `_encrypted` pero sin código que encripte |
| 12 | Notificaciones | **SOLO SCHEMA** | 5% | Tabla existe, campana en el header existe sin datos, sin service/route |
| 13 | Autenticación + multi-tenancy | **COMPLETO** | 95% | Falta: recuperar contraseña, gestión de usuarios dentro del estudio (invitar USER desde ADMIN), cambiar contraseña. El registro funciona, el login funciona, hay session persistente vía JWT cookie |

**Lectura global:** el esqueleto está bien puesto (modelos + ejemplos de CRUD backend de los primeros 6 dominios). El MVP está lejos: los 2 diferenciadores (IA y scraping) son literalmente `throw new Error`, y todo el frontend de datos es placeholder.

### C2. Riesgos técnicos prioritarios

**Los 5 más importantes, ordenados por gravedad:**

**1. Tipos del frontend completamente desalineados con el backend (gravedad alta)**
- **Qué:** `frontend/src/types/index.ts` tiene interfaces `Case`, `Matter`, `Movement`, `Event`, `Person` que no reflejan el schema actual. En `Case` faltan 9 campos; en `Movement` no coincide casi ningún campo.
- **Por qué es grave:** cualquier UI que se construya sobre estos tipos va a romper en runtime contra la API real o va a necesitar rehacerse. Si el fundador arranca a pedir "hacé la pantalla de expedientes", el código generado puede usar tipos fantasma.
- **Dónde:** [frontend/src/types/index.ts](frontend/src/types/index.ts) (todo el archivo).
- **Esfuerzo:** **chico** (1h) si se regenera manualmente ahora, **medio** (2-4h) si se introduce un mecanismo de generación automática (ej. exportar tipos desde `backend/src/models/` como paquete compartido, o generar Zod→TS).

**2. "Encriptación" de credenciales de portal es solo el nombre de la columna (gravedad alta — seguridad)**
- **Qué:** las columnas se llaman `username_encrypted` y `password_encrypted`, pero no hay código de encriptación en todo el backend. Cuando se implemente el scraper, el riesgo es guardar las credenciales de portales judiciales en plano si alguien no lee CLAUDE.md.
- **Por qué es grave:** un abogado pone las credenciales de MEV / SAE. Esas credenciales dan acceso a sus expedientes judiciales. Fuga = desastre reputacional y legal.
- **Dónde:** [backend/src/models/portal-credentials.ts:10-11](backend/src/models/portal-credentials.ts:10).
- **Esfuerzo:** **medio** (2-3h): decidir KMS/clave simétrica, implementar módulo `crypto-service` con `crypto.createCipheriv` (AES-256-GCM), agregar env var `ENCRYPTION_KEY`, usar en service cuando se implemente.
- Mitigación temporal: agregar un `README.md` en `portal-scraper/` que deje explícito el bloqueador.

**3. Campos de auditoría faltantes en 3 tablas (gravedad media)**
- **Qué:** `notifications` (falta `updated_at`, `updated_by`, `created_by`), `case_links` (falta `updated_by`, `updated_at`), `portal_credentials` (falta `created_by`, `updated_by`). CLAUDE.md exige los 4 campos "desde el día uno".
- **Por qué es grave:** arreglarlo **ahora** cuesta 1 migración; arreglarlo con datos reales en producción cuesta un downtime. Además pierde trazabilidad ("¿quién creó esa notificación?", "¿quién modificó las credenciales?").
- **Dónde:**
  - [backend/src/models/notifications.ts](backend/src/models/notifications.ts)
  - [backend/src/models/case-links.ts](backend/src/models/case-links.ts)
  - [backend/src/models/portal-credentials.ts](backend/src/models/portal-credentials.ts)
- **Esfuerzo:** **chico** (<1h): agregar 3 columnas por tabla + `drizzle-kit generate` + revisar que el future-service las llene.

**4. Sin tests, sin linter, sin CI (gravedad media — acumulativa)**
- **Qué:** no hay un solo test, ni ESLint, ni workflow de GitHub. Dado que `convertToCase` ya es una transacción compleja que copia 4 tipos de entidad, y que el scraper/IA serán aún más complejos, esto va a morder rápido.
- **Por qué es grave:** el fundador no es programador. Sin CI que corra tipos/tests, los bugs van a aparecer cuando se toque algo. Un test de regresión para `convertToCase` sería extremadamente valioso — copia parties + movements + documents + events y marca el matter como convertido.
- **Dónde:** ausencia en la raíz y en `backend/package.json` / `frontend/package.json`.
- **Esfuerzo:** **medio** (3-4h): instalar vitest + tsc en CI + un workflow mínimo. Eslint con la config de `@typescript-eslint` va en 30 min.

**5. Zustand y React Query instalados y sin uso (gravedad baja — deuda ligera)**
- **Qué:** `zustand@5.0.12` y `@tanstack/react-query@5.95.2` están en `frontend/package.json` y cargan en el bundle. El provider de React Query está montado ([App.tsx:12-19](frontend/src/App.tsx:12)) pero no hay ningún `useQuery`. Zustand: ni siquiera importado.
- **Por qué es grave:** no es grave, pero es inconsistente. Cuando se construya la UI de datos, hay que decidir: ¿Zustand para estado cliente + React Query para server, o solo React Query? No haberlo decidido puede generar UI que mezcle patrones.
- **Dónde:** [frontend/package.json:16,27](frontend/package.json:16).
- **Esfuerzo:** **chico** (<1h): definir el patrón en CLAUDE.md o remover una de las dos dependencias.

### C3. Decisiones pendientes que bloquean progreso

**Ya resueltas en el código (actualizar CLAUDE.md):**
- ORM → **Drizzle**
- Claves primarias → **UUIDv7 en `text`**
- Librería UI → **shadcn/ui**
- Auth → **JWT en cookie httpOnly**
- Framework backend → **Express**
- Validación → **Zod v4**

**Realmente pendientes y que bloquean features del MVP:**

| Decisión | Bloquea | Urgencia |
|---|---|---|
| **SDK / cliente Anthropic** (`@anthropic-ai/sdk`) y diseño de tool-calling | Feature de IA (módulo 10) | **Alta** — es un diferencial |
| **Librería de scraping** (Playwright vs. Puppeteer vs. crawlee) + estrategia headless/headful | Feature de portales (módulo 11) | **Alta** — es el otro diferencial |
| **Cifrado simétrico** (KMS vs. env-var-AES) | Portal credentials | **Alta** — seguridad |
| **Editor rich-text** (TipTap o alternativa) | Plantillas (módulo 8) y Escritos | **Media** — Escritos es feature del MVP |
| **Storage S3-compatible** (provider + SDK: `@aws-sdk/client-s3` con MinIO, o Cloudflare R2 con `@aws-sdk/client-s3`, o API nativa de cada uno) | Documentos (módulo 7) | **Media** — necesario para MVP pero se puede postergar dos sprints |
| **Estrategia de estado cliente** (Zustand + Query, solo Query, Context) | Cualquier UI de datos | **Media** — decidir antes de empezar `/cases` |
| **Mecanismo de tipos compartidos** (paquete shared, tRPC, OpenAPI, generación manual) | Toda la integración frontend-backend | **Media** — lo antes posible, antes de escribir más UI |
| **Proveedor de hosting** (Railway, Render, Fly.io, Vercel+Railway combinado) | Deploy | **Baja** — hasta tener MVP |
| **Gestor de jobs** (para portal-scraper periódico: `node-cron`, `bullmq`, job de hosting) | Scraper periódico | **Media** — junto con scraping |

---

## Resumen ejecutivo

**Lo que está bien:**
- Schema de base de datos completo para el MVP (15 tablas).
- Multi-tenancy por `firm_id` cumplido en TODAS las queries de los services implementados.
- Backend de 6 dominios (auth, persons, courts, cases, matters, parties) completo con CRUD + filtros + validación Zod + manejo de errores consistente.
- `convertToCase` transaccional que copia parties/movements/documents/events.
- Frontend: i18n consistente, theme dark/light, protected routes, layout responsivo, colección de componentes UI lista (shadcn).

**Lo que está mal o falta:**
- **Los 2 diferenciadores (IA + scraping) son 0%.** Ni SDKs instalados, ni un hello-world.
- **La UI de datos es 0%.** Todas las rutas de módulos son placeholders.
- **Los tipos del frontend están desincronizados** con el schema real — bloqueador para construir cualquier UI.
- **Ninguna forma de encriptación implementada** — las credenciales de portales se guardarían en plano.
- **3 tablas violan la regla de campos de auditoría** (`notifications`, `case_links`, `portal_credentials`).
- Tests, linter, CI: cero.
- 8 de los 15 modelos están solo como schema (`events`, `movements`, `errands`, `documents`, `templates`, `notifications`, `case_links`, `portal_credentials`).

**Recomendación de secuencia (no solicitada, pero implícita en el pedido "qué construir primero"):**
1. Alinear tipos frontend ↔ backend (riesgo #1) + decidir mecanismo de sincronización.
2. Agregar los campos de auditoría faltantes (riesgo #3) — 1 migración.
3. Construir la UI de **Cases** y **Persons** sobre el backend existente — valida end-to-end antes de seguir acumulando backend.
4. Decidir + implementar `events` + `movements` service → entonces la UI de expedientes empieza a tener sentido.
5. Elegir editor rich-text + implementar Templates.
6. Implementar cifrado simétrico, luego IA, luego scraper (en ese orden).

---

## Actualización — 2026-04-17 · Tarea A: `shared/` + Zod como fuente de verdad

**Estado:** recomendación #1 del resumen ejecutivo **resuelta**. Las demás siguen pendientes.

### Qué se hizo

- Nueva carpeta [shared/](shared/) en la raíz del repo con schemas Zod por dominio (`auth`, `user`, `firm`, `person`, `court`, `case`, `matter`, `party`) + utilidades comunes (`paginatedSchema`, `errorResponseSchema`, enums). Sin `package.json` — es una carpeta de código, no un workspace.
- Alias `@shared` configurado en:
  - `backend/tsconfig.json` (paths) + runtime con `tsconfig-paths/register` vía `ts-node`
  - `frontend/tsconfig.json` (paths) + `frontend/vite.config.ts` (alias en formato regex)
- Backend refactorizado:
  - Los 6 controllers (`auth`, `person`, `case`, `matter`, `court`, `party`) ahora importan los schemas desde `@shared` y delegan el formato de errores a `backend/src/utils/zod-error.ts`.
  - Los 6 services reemplazan sus interfaces locales por `type X = z.infer<typeof shared.xCreateSchema>` (aliasadas sobre los tipos inferidos de `@shared`).
  - `backend/src/middleware/error-handler.ts` ahora tipa la respuesta con el `ErrorResponse` de `@shared`.
  - **Eliminados:** todo `backend/src/validators/` (5 archivos) y el duplicado `backend/src/types/index.ts`. Queda únicamente `backend/src/types/express.ts` (augmentación de `Request`, no sale por la red).
- Frontend refactorizado:
  - `frontend/src/services/auth.service.ts` y `frontend/src/contexts/auth-context.tsx` consumen `AuthUser` y `RegisterRequest` desde `@shared`.
  - `frontend/src/components/ui/person-select.tsx` usa `PersonSearchResult` de `@shared`.
  - `frontend/src/types/index.ts` quedó reducido a `export * from "@shared"` para no romper el código existente que importaba desde `@/types`. Futuros módulos deberían importar directamente desde `@shared`.
  - Instalados `react-hook-form@7.72` y `@hookform/resolvers@5.2`. Todavía sin consumidores — se adoptarán cuando se arranquen los primeros forms reales.
- CLAUDE.md actualizado con nueva sección "Tipos compartidos", nuevo árbol de carpetas y notas sobre el alias `@shared`.

### Discrepancias detectadas al tipar los schemas (ahora fijadas en `shared/`)

Comparando el schema que el backend realmente devuelve vs. lo que los tipos del frontend declaraban, se confirmaron los drifts que marcaba B3 y se encontraron otros:

| Entidad | Hallazgo al crear el schema |
|---|---|
| `Case` | El frontend definía 11 campos sobre los 20 reales del backend. Se reescribió con los 20 (incluye `jurisdiction`, `processType`, `primaryClientId`, `responsibleAttorneyId`, `startDate`, `claimedAmount`, `currency`, `portalUrl`, `notes`, `isActive`). |
| `Matter` | El frontend tenía un campo ficticio `description` que no existe en la tabla. Eliminado. Se incorporaron `matterType`, `primaryClientId`, `opposingPartyId`, `responsibleAttorneyId`, `startDate`, `estimatedFee`, `currency`, `notes`, `convertedToCaseId`, `isActive`. |
| `Person` | Faltaban `personType`, `businessName`, `cuitCuil`, `mobilePhone`, dirección completa, `legalAddress`, `appointedAddress`, `notes`, `isActive`. Incorporados. `PersonSearchResult` quedó como schema separado (subset para autocomplete). |
| `Party` | El frontend no tenía shape alguno. Se creó con `caseId`/`matterId` (XOR), `personId`, `role`, `isPrimary`, auditoría. |
| `Court` | Se creó desde cero (no había tipo en el frontend). |
| `Movement` | **No se creó schema** — el backend no expone endpoints de movements todavía. Queda como deuda para cuando se haga el service. |
| `Event` | **No se creó schema** — ídem. |
| `Errand`, `Document`, `Template`, `Notification`, `CaseLink`, `PortalCredential` | Sin schema. Son "SOLO SCHEMA de DB" en el módulo status — cuando tengan endpoints, se agregan al contrato. |

### Drift que ya NO existe

La fila 1 de C2 ("Tipos del frontend completamente desalineados con el backend") y la sección B3 se consideran resueltos **para los 6 dominios con backend implementado**. Cualquier drift futuro romperá la compilación de ambos proyectos al mismo tiempo.

### Drift que SIGUE existiendo

- Entidades sin endpoint y por lo tanto sin schema en `shared/`: `Movement`, `Event`, `Errand`, `Document`, `Template`, `Notification`, `CaseLink`, `PortalCredential`. Cada vez que se le agregue un service, hay que crear el schema correspondiente en `shared/schemas/` y actualizar el barrel.
- `status-badge.tsx` sigue con los enum labels hardcodeados en español (B1). No se tocó en esta tarea.

### Verificaciones corridas

- `tsc --noEmit` backend: limpio.
- `tsc` build backend (emit completo): limpio — layout de `dist/` quedó `dist/backend/src/` + `dist/shared/` al dejar que TS infiera `rootDir`.
- `tsc --noEmit` frontend: limpio.
- `vite build` frontend: limpio (388 KB / 124 KB gz).
- Smoke test runtime con `ts-node`: import de `@shared` resuelve, schema y enum se cargan.
- **No verificado end-to-end** (login/register/dashboard contra la API): el entorno no tiene `DATABASE_URL` configurado. Queda a verificar manualmente tras el pull.

### Follow-ups abiertos de esta tarea

1. ~~Decidir cómo empaquetar el backend para producción.~~ **Resuelto 2026-04-17** con `tsc-alias` sumado al script de build (`tsc && tsc-alias -p tsconfig.build.json`). El `tsconfig.build.json` extiende el tsconfig principal pero deja sólo el alias `@shared`, para que tsc-alias no toque los imports de `zod/v4` (que se resuelven por Node al encontrar `backend/node_modules/zod`). El JS emitido en `dist/` corre con `node` plano — verificado cargando `dist/backend/src/index.js` (falla sólo en `app.listen` por puerto ocupado, no en resolución de módulos).
2. Migrar los consumidores restantes del frontend a importar directamente desde `@shared` y, en algún momento, vaciar `frontend/src/types/index.ts`.
3. Schemas pendientes (`movement`, `event`, `errand`, `document`, `template`, `notification`, `caseLink`, `portalCredential`) se crean junto con el service correspondiente — no antes.

---

Actualización 2026-04-17 bis: resuelto el problema #3 (campos de auditoría faltantes). `notifications`, `case_links` y `portal_credentials` ahora cumplen la regla de CLAUDE.md. Migración: `backend/drizzle/0001_parched_black_bolt.sql`.

Actualización 2026-04-17 ter: resuelto el problema #5 (Zustand y React Query sin patrón). Decisión: React Query + Context como estándar. Zustand removido. Patrones documentados en CLAUDE.md sección "Patrones de frontend — reglas".

Actualización 2026-04-17 quater: resuelto parcialmente el estado "BACKEND COMPLETO / UI 0%" del módulo Personas (§A4, fila 4). Ahora tiene UI completa: listar + crear + editar + borrar (soft delete). Es la implementación de referencia para los otros 14 módulos. Pendiente tarea C.2 (búsqueda, filtros, paginación). Ajustes colaterales: se removió el regex de `cuitCuil` en `shared/schemas/person.ts` (el campo acepta DNI/CUIT/CUIL sin formato) y se eliminó el check de vinculaciones a `parties` en `person.service.softDelete` — el soft delete es justamente el mecanismo para preservar las vinculaciones históricas.

Actualización 2026-04-17 (tarea D2): sub-expedientes estilo Tucumán implementados sobre el módulo Cases ya completo. Mecanismo: el sub es un `case` completo con `sub_case_type` seteado; vínculo padre→hijo en `case_links` con `link_type = SUB_CASE`. Numeración automática `{padre.caseNumber}-{prefijo}{seq}` (A=actor, D=demandado, X=otro). El listado principal `/cases` filtra `sub_case_type IS NULL` y trae `subCaseCount` por padre. Archive del padre cascadea a hijos activos (transaccional); unarchive es individual. UI: tab "Subexpedientes" en el detalle, modal de creación, banner "Este es un subexpediente de…" en el detalle del hijo, sufijo "(N subexpedientes)" en el listado. No-sub-de-sub validado en backend y UI. Migración: `backend/drizzle/0002_bumpy_starfox.sql`. Reglas documentadas en CLAUDE.md sección "Subexpedientes (estilo Tucumán)".
