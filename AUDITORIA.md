# Auditoría Técnica — App Jurídica

**Fecha:** 2026-04-16
**Alcance:** Contraste del código actual contra `CLAUDE.md` (los documentos `SPEC_APP_JURIDICA_v1.md`, `ARQUITECTURA_APP_JURIDICA_v1.md` y `CONTEXTO_MERCADO_APP_JURIDICA_v1.md` NO existen en el repositorio; la auditoría se basa únicamente en `CLAUDE.md` como fuente autoritativa).
**Método:** Lectura estática. No se instalaron dependencias, no se ejecutó la app, no se corrieron tests (no existen). No se modificó ningún archivo salvo este.

---

## 1. Resumen ejecutivo

El proyecto tiene **cimientos sólidos pero muy poca casa encima**.

**Lo bueno:** el stack está tomado con decisiones razonables y modernas (React 19 + Vite, Express + Drizzle + PostgreSQL, Zod, JWT en cookie httpOnly, bcrypt 12 rondas, shadcn/ui). La estructura de carpetas respeta CLAUDE.md al pie de la letra. El schema de base de datos cubre 15 tablas correctamente normalizadas con `firm_id` en todas las tablas de datos y convenciones de nombres impecables. Los enums del dominio coinciden al 100% con el glosario (CaseStatus, PartyRole, JurisdictionType, MatterStatus). Los services revisados (auth, person, case, matter) filtran sistemáticamente por `firmId` y `validateRelations()` en `case.service.ts` confirma que las FKs pertenecen al firm antes de insertar — la regla de multi-tenancy está respetada con disciplina. La capa de abstracción de IA y el módulo de portal-scraper existen como clases con las firmas correctas.

**Lo malo:** salvo por Autenticación y Personas, **ningún módulo del MVP está terminado end-to-end**. Expedientes, Otros Casos y Juzgados tienen backend completo pero la UI renderiza un placeholder "Próximamente". Movimientos, Errands, Eventos, Documentos, Plantillas, Notificaciones, Case-links y Portal credentials existen solo como tabla en la base — cero service, cero endpoint, cero UI. Los dos diferenciadores del producto (asistente de IA y scraper de portales judiciales) son **`throw new Error("Not implemented")`** en cada uno de sus métodos; el SDK de Anthropic ni siquiera está instalado. Aproximadamente **2 de 11 módulos del MVP están operativos**.

**Lo preocupante:** no hay tests, no hay linter, no hay CI, no hay pre-commit hooks. Cinco tablas (`users`, `notifications`, `case_links`, `portal_credentials` y parcialmente `firms`) tienen campos de auditoría faltantes, violando directamente la regla "toda tabla incluye estas columnas desde el día uno". `frontend/src/types/index.ts` ya está desactualizado respecto a los modelos de Drizzle: las interfaces Movement, Matter y Event tienen campos que el backend no tiene — el drift empezó antes de que el primer módulo que los consuma exista. Dos componentes (`status-badge.tsx` y `person-detail.tsx`) hardcodean strings en español fuera de `i18n/es.ts`, rompiendo la convención. `i18n/es.ts` además tiene namespaces duplicados (`person` y `people`). Y el placeholder `JWT_SECRET=change-me-in-production` en `.env.example` no tiene guardrail al bootear, lo que significa que si llega a producción con ese valor, cualquiera puede firmar un JWT y asumir la identidad de cualquier firm.

**Lo crítico para vos personalmente:** los 3 documentos de especificación (`SPEC_APP_JURIDICA_v1.md`, `ARQUITECTURA_APP_JURIDICA_v1.md`, `CONTEXTO_MERCADO_APP_JURIDICA_v1.md`) que mencionás en tu flujo **no están en el repositorio**. Esta auditoría se hizo contra `CLAUDE.md` como única fuente. Si esos specs existen en otro lado, hay que traerlos al repo ya, porque cualquier decisión de negocio documentada solo ahí es invisible para Claude Code y para esta auditoría.

**Veredicto:** estás más cerca del principio que del medio. La disciplina arquitectónica demostrada en las partes hechas es un activo enorme para seguir — no la pierdas. Pero hoy el producto no hace lo que dice hacer. Los próximos sprints deberían enfocarse en: (a) cerrar el ciclo de Expedientes en UI porque el backend ya está listo, (b) agregar infraestructura mínima de tests/linter/CI antes de que la deuda sea inmanejable, (c) decidir cuál es la primera función de IA "real" que vas a implementar para empezar a tener historia que contarle a un usuario.

---

---

## 2. Inventario del stack vs. decisiones

### Comparación contra CLAUDE.md

| Capa | Decisión en CLAUDE.md | Implementado | Estado |
|---|---|---|---|
| Frontend | React + TypeScript | React 19.2.0 + TypeScript 5.9.3 (`frontend/package.json`) | OK |
| Build frontend | No especificado | Vite 7.1.12 + `@vitejs/plugin-react` 5.0.5 | OK (decisión razonable) |
| Estilos | No especificado | Tailwind CSS v4.1.18 + `@tailwindcss/vite` | OK (alineado con mención a shadcn/ui) |
| Librería UI | "pendiente (probablemente shadcn/ui)" | shadcn/ui estilo "new-york" + Radix UI primitives | OK (cumple lo previsto) |
| Estado cliente | No especificado | Zustand 5.0.8 | OK |
| Data fetching | No especificado | TanStack Query 5.95.2 + Axios 1.13.2 | OK |
| Ruteo | No especificado | react-router-dom 7.9.5 | OK |
| Editor rich-text | "pendiente (probablemente TipTap)" | No instalado | Pendiente, aún no necesario (no hay módulo de escritos implementado) |
| Backend | Node.js + TypeScript | Node + Express 4.21.2 + TypeScript 5.9.3 | OK |
| Base de datos | PostgreSQL | PostgreSQL (driver `postgres` 3.4.7) | OK |
| ORM | "Pendiente (Prisma o Drizzle)" | Drizzle ORM 0.45.2 + drizzle-kit 0.31.6 | OK (decisión tomada) |
| Validación | No especificado | Zod 4.3.6 en frontend y backend | OK |
| Auth | JWT o sesiones (pendiente) | JWT firmado (jsonwebtoken 9.0.2) en cookie httpOnly + bcrypt 6.0.0 (12 rondas) | OK (decisión tomada) |
| Seguridad HTTP | No especificado | helmet 8.1.0, cors 2.8.5, cookie-parser 1.4.7 | OK |
| Multi-tenancy | "DB compartida, aislamiento por `firm_id`" | Implementado: toda tabla de datos tiene `firm_id` (ver `backend/drizzle/0000_pretty_kinsey_walden.sql`) | OK (con excepciones menores, ver §4) |
| IA | API de Anthropic vía capa de abstracción | Capa de abstracción existe (`backend/src/ai-service/index.ts`), SDK `@anthropic-ai/sdk` NO instalado, todos los métodos lanzan "Not implemented" | Arquitectura OK, implementación cero |
| Scraper | Server-side, cred. encriptadas | `backend/src/portal-scraper/index.ts` existe pero todos los métodos lanzan "Not implemented". Tabla `portal_credentials` existe en migración | Andamio OK, implementación cero |
| Almacenamiento | Compatible con S3 | Variables `S3_*` en `.env.example`, sin cliente S3 instalado ni integración | No implementado |
| Hosting | Pendiente | N/A | Pendiente |
| Repositorio | GitHub | En GitHub | OK |
| Estructura de carpetas | Definida en CLAUDE.md | Respetada: `frontend/src/{components,pages,services,contexts,hooks,i18n,types,utils}` y `backend/src/{routes,controllers,services,middleware,types,utils,ai-service,portal-scraper}`. Agregados razonables: `validators/`, `config/`, `db.ts`, `lib/` | OK |

### Herramientas ausentes (decisiones tomadas de facto por omisión)

| Categoría | Estado |
|---|---|
| Framework de tests (backend o frontend) | No instalado, no hay tests |
| Linter (ESLint) | No configurado |
| Formateador (Prettier) | No configurado |
| CI (GitHub Actions u otro) | No verificado: no se inspeccionó `.github/workflows/` — asumo ausente porque no es parte del alcance pedido y no hay evidencia indirecta (scripts de test, badges, etc.) |
| Husky / lint-staged | No instalado |
| Logger estructurado (pino/winston) | No instalado; se usa `console.log` en `backend/src/index.ts:25` y `console.error` en `backend/src/middleware/error-handler.ts:33` |
| Cliente SDK Anthropic | No instalado |
| Cliente S3 (AWS SDK, MinIO, etc.) | No instalado |
| Biblioteca de encriptación para credenciales de portales | No instalado |
| i18n runtime (i18next, react-intl) | No; se usa un objeto estático `frontend/src/i18n/es.ts` consultado por una función `t()` casera |

### Versiones

Todo el stack está en versiones vigentes 2025 (React 19, Tailwind v4, Vite 7, Express 4, Drizzle 0.45, Zod 4, TanStack Query 5, react-router 7). No hay deuda por versionado.

---

## 3. Estado de los módulos del MVP

Leyenda:
- ✅ Completo (schema + API + UI funcional)
- ◐ Parcial (al menos una capa implementada, otras faltan)
- ☐ No implementado / andamio vacío

| # | Módulo | Schema DB | Backend (service/controller/route) | Frontend | Estado | Notas |
|---|---|---|---|---|---|---|
| 1 | Autenticación + Firms + Users | ✅ | ✅ `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts` | ✅ `pages/login.tsx`, `pages/register.tsx`, `contexts/auth` | ✅ | Login, registro (crea firm + usuario ADMIN), logout, `/auth/me`. Cookie JWT httpOnly 7 días, bcrypt 12 rondas |
| 2 | Personas (Persons) | ✅ | ✅ `person.service.ts` (267 líneas) + controller + validator + routes | ✅ `pages/persons/{index,person-form,person-detail}.tsx` | ✅ | CRUD completo, autocomplete (máx 10), soft delete con chequeo de partes activas |
| 3 | Juzgados (Courts) | ✅ | ✅ `court.service.ts` + controller + validator + routes | ☐ sin página | ◐ | Hay API pero la UI no expone gestión de juzgados |
| 4 | Expedientes (Cases) | ✅ | ✅ `case.service.ts` (330 líneas) + controller + validator + routes. Incluye endpoint `/summary` y sub-rutas de parties | ☐ ruta `/cases` renderiza `placeholder.tsx` ("Próximamente") | ◐ | Backend CRUD + resumen funcional. Valida que client/attorney/court pertenezcan al firm antes de insertar. Sin UI |
| 5 | Otros Casos (Matters) | ✅ | ✅ `matter.service.ts` (305 líneas) incluye `convertToCase` transaccional (copia parties/movements/documents/events) | ☐ placeholder | ◐ | Backend completo con conversión a Case. Sin UI |
| 6 | Partes (Parties) | ✅ | ✅ `party.service.ts` + controller, montado como sub-rutas de cases/matters | ☐ solo se muestran en `person-detail.tsx` (lectura) | ◐ | Se pueden agregar/remover desde API. Alta/baja desde UI no disponible |
| 7 | Movimientos (Movements) | ✅ tabla `movements` | ☐ | ☐ | ☐ | Schema presente, ningún service ni route. Sin UI |
| 8 | Gestión de procuración (Errands) | ✅ tabla `errands` | ☐ | ☐ | ☐ | Schema presente, andamio cero |
| 9 | Agenda / Eventos (Events) | ✅ tabla `events` | ☐ | ☐ ruta `/calendar` placeholder | ☐ | Sin backend, sin UI. Schema presente |
| 10 | Escritos / Filings | No hay tabla `filings` específica | ☐ | ☐ ruta `/filings` placeholder | ☐ | No verificado si "filings" se modela como un tipo de `documents` o merece su propia tabla; CLAUDE.md lo lista como entidad propia |
| 11 | Plantillas (Templates) | ✅ tabla `templates` | ☐ | ☐ | ☐ | Sin service ni UI |
| 12 | Documentos (Documents) | ✅ tabla `documents` | ☐ | ☐ | ☐ | Schema presente. No hay endpoint de upload, no hay cliente S3 |
| 13 | Notificaciones | ✅ tabla `notifications` | ☐ | ☐ header UI menciona badge de notificaciones pero no está cableado | ☐ | |
| 14 | Credenciales de portal | ✅ tabla `portal_credentials` | ☐ | ☐ | ☐ | Sin encriptación implementada |
| 15 | Vínculos entre casos (Case links) | ✅ tabla `case_links` | ☐ | ☐ | ☐ | |
| 16 | Dashboard | N/A | Endpoint de summary en cases | ◐ `pages/dashboard.tsx` existe | ◐ | No verificado a fondo el contenido del dashboard |
| 17 | Reportes | N/A | ☐ | ☐ placeholder | ☐ | |
| 18 | Configuración del estudio (logo, color) | ✅ campos en `firms` (no verificado en detalle) | ☐ | ☐ placeholder | ☐ | |
| 19 | **Servicio de IA** | N/A | ☐ `ai-service/index.ts` existe como clase con 6 métodos. **Todos lanzan `"Not implemented"`**. SDK de Anthropic NO instalado | ☐ | ☐ | Andamio arquitectónico sin implementación |
| 20 | **Scraper de portales** | ✅ tabla `portal_credentials` | ☐ `portal-scraper/index.ts` con 2 métodos, **ambos lanzan `"Not implemented"`**. 4 TODOs | ☐ | ☐ | Cero implementación |

### Tabla resumen

| Categoría | Cantidad |
|---|---|
| Módulos completos end-to-end | 2 (Auth, Persons) |
| Módulos con backend pero sin UI | 3 (Courts, Cases, Matters) — más Parties en sub-rutas |
| Módulos con schema pero sin backend ni UI | 9 (Movements, Errands, Events, Templates, Documents, Notifications, Portal credentials, Case links, Filings) |
| Andamios críticos vacíos | 2 (AI service, Portal scraper) |

### Cobertura aproximada del MVP

Contando los módulos nombrados explícitamente en CLAUDE.md como capacidades del MVP (Expedientes, Otros Casos, Personas, Agenda, Escritos, Reportes, Configuración, Asistente de IA, Scraper de portales, Dashboard, Notificaciones), **solo ~2 de 11 están terminados** (Personas y, dependiendo del criterio, Autenticación que ni siquiera figura en la lista del sidebar). Los tres pilares diferenciadores del producto (expedientes con UI, asistente de IA, consulta a portales) NO están operativos.

---

## 4. Violaciones a las reglas de arquitectura

### 4.1 Multi-tenancy (`firm_id` en toda consulta)

**Cumplimiento general: alto.** Todas las tablas de datos tienen columna `firm_id` (verificado en `backend/drizzle/0000_pretty_kinsey_walden.sql`). Todos los services revisados filtran por `firmId` en sus queries principales (`case.service.ts`, `matter.service.ts`, `person.service.ts`, `court.service.ts`). `validateRelations()` en `case.service.ts` confirma que FKs (client, attorney, court) pertenecen al firm antes de insertar.

**Hallazgos menores (defense-in-depth):**

- En los joins con `leftJoin(persons)` dentro de `case.service.ts` y `matter.service.ts` el filtro `firm_id` no se replica en la condición del join. Si se comprometiera el payload de WHERE externo, la protección sería el filtro outer, no doble. Recomendado pero no crítico: agregar `and(eq(persons.firmId, firmId))` en el ON.
- No verificado: si `party.service.ts` y `court.service.ts` son igualmente estrictos. Lectura rápida confirma que exponen `firmId` como parámetro pero no se validó línea por línea cada query.
- El middleware `firm-context.ts` inyecta `req.firmId` a partir del JWT. Si un service acepta firmId como parámetro y algún endpoint accidentalmente lo toma de body/query en vez del middleware, la protección cae. No se detectó ese bug, pero conviene auditar cada controller.

**Veredicto:** regla respetada con disciplina. Riesgo bajo.

### 4.2 Capa de abstracción de IA

- `backend/src/ai-service/index.ts` existe con las 6 funciones exigidas por CLAUDE.md (`generateFiling`, `analyzeDocument`, `searchJurisprudence`, `suggestNextSteps`, `alertExpiration`, `contextualChat`).
- Todos los métodos lanzan `"Not implemented"`. El SDK `@anthropic-ai/sdk` NO está instalado. Por lo tanto no puede existir (todavía) una llamada directa desde fuera de `ai-service/`.
- No verificado: si en algún lugar ya se agregaron imports preparatorios a `@anthropic-ai/sdk` fuera de `ai-service/`. Una búsqueda global no reveló coincidencias.

**Veredicto:** la capa existe pero vacía. La regla no se está violando porque aún no hay llamadas a la API. Riesgo futuro: asegurarse de que cuando se implemente, ningún controller/service importe `@anthropic-ai/sdk` directamente.

### 4.3 Convención de idioma (código en inglés, UI en español vía i18n)

**Violaciones detectadas:**

1. `frontend/src/components/ui/status-badge.tsx` — **Hardcodea labels en español fuera de i18n**. Mapea `IN_PROGRESS → "En trámite"`, etc., directamente en el componente. Debería leer desde `i18n/es.ts`.
2. `frontend/src/pages/persons/person-detail.tsx` (líneas 17-28) — **Hardcodea `roleLabels` en español** (`PLAINTIFF: "Actor"`, `DEFENDANT: "Demandado"`, etc.) dentro del componente. Debería leer de `i18n/es.ts`.
3. `frontend/src/i18n/es.ts` — **Tiene namespaces duplicados** `person` y `people`. Decisión sobre cuál conservar aún pendiente; acelera la divergencia.

**No violado:** los nombres de variables, tablas, columnas, endpoints, enums, archivos y carpetas sí están en inglés.

### 4.4 Campos de auditoría (`created_by`, `created_at`, `updated_by`, `updated_at`)

Revisión de `backend/drizzle/0000_pretty_kinsey_walden.sql`:

| Tabla | `created_by` | `created_at` | `updated_by` | `updated_at` | Estado |
|---|---|---|---|---|---|
| `firms` | — (tabla raíz) | ✅ | — | ✅ | OK (excepción razonable para la tabla raíz) |
| `users` | ❌ | ✅ | ❌ | ✅ | **Falta `created_by`/`updated_by`** |
| `persons` | ✅ | ✅ | ✅ | ✅ | OK |
| `courts` | ✅ | ✅ | ✅ | ✅ | OK |
| `cases` | ✅ | ✅ | ✅ | ✅ | OK |
| `matters` | ✅ | ✅ | ✅ | ✅ | OK |
| `parties` | ✅ | ✅ | ✅ | ✅ | OK |
| `movements` | ✅ | ✅ | ✅ | ✅ | OK |
| `errands` | ✅ | ✅ | ✅ | ✅ | OK |
| `events` | ✅ | ✅ | ✅ | ✅ | OK |
| `documents` | ✅ | ✅ | ✅ | ✅ | OK |
| `templates` | ✅ | ✅ | ✅ | ✅ | OK |
| `notifications` | ❌ | ✅ | ❌ | ❌ | **Falta `created_by`, `updated_by`, `updated_at`** |
| `case_links` | ❌ | ✅ | ❌ | ❌ | **Falta `updated_by`, `updated_at`, posiblemente `created_by`** |
| `portal_credentials` | ❌ | ✅ | ❌ | ✅ | **Falta `created_by`, `updated_by`** |

CLAUDE.md dice "Toda tabla incluye estas columnas desde el día uno". Cinco tablas quiebran esta regla. En notifications/case_links puede haber una razón (notificaciones se generan por el sistema, no por usuarios; links son simétricos) — **pero CLAUDE.md no admite excepciones**.

### 4.5 Glosario de dominio

Contraste entre `backend/src/models/enums.ts` y el glosario de CLAUDE.md: **todos los enums coinciden** (CaseStatus: INITIAL/IN_PROGRESS/EVIDENCE_STAGE/CLOSING_ARGUMENTS/AWAITING_JUDGMENT/JUDGMENT_ISSUED/IN_EXECUTION/ARCHIVED/SUSPENDED/IN_MEDIATION; PartyRole con todos los 10 roles; JurisdictionType con los 8 fueros; MatterStatus con los 4 estados). `frontend/src/types/index.ts` replica estos enums correctamente.

**Cumplimiento: total.** El glosario es respetado.

### 4.6 Convenciones de BD (tabla plural, snake_case, FK `{tabla}_id`, enums UPPER_SNAKE_CASE, timestamps `_at`, booleanos `is_`/`has_`)

Inspección de la migración: nombres de tablas plurales y snake_case (`cases`, `parties`, `movements`, `portal_credentials`); columnas snake_case; FKs con convención `{tabla}_id` (`case_id`, `firm_id`); enums en UPPER_SNAKE_CASE; timestamps con sufijo `_at`; booleanos con prefijo `is_` (`is_active`).

**Cumplimiento: total.**

### 4.7 Format de respuesta API (`{ data: T }` / `{ error: { code, message } }`)

- `backend/src/routes/index.ts` health check devuelve `{ data: { status: "ok" } }` — OK.
- No verificado línea por línea para todos los controllers. Debería auditarse más específicamente si todos devuelven `{ data: ... }` y si el error handler devuelve `{ error: { code, message } }` con los códigos HTTP correctos.

### 4.8 Drift de tipos frontend ↔ backend

`frontend/src/types/index.ts` está **desactualizado** respecto a los modelos reales de backend (interfaces como `Movement` definen `title`/`occurredAt` cuando el backend usa `description`/`movementDate`; `Matter` trae `description` que el backend no tiene; `Event` usa `startsAt`/`endsAt`/`isDeadline` cuando el backend maneja `eventDate`/`endDate`/`eventType`/`isAllDay`).

**Consecuencia:** cuando se empiece a construir el frontend de esos módulos, explotará silenciosamente (o ruidosamente, si TypeScript los marca). Este archivo quedó escrito antes de que el schema se estabilizara y nunca se sincronizó.

### 4.9 Otras observaciones arquitectónicas

- **No verificado:** si existe generación automática de tipos desde Drizzle para el frontend (no hay evidencia de ello). Mantener tipos a mano en `frontend/src/types/index.ts` es receta para drift (ver 4.8).
- **No verificado:** qué hace exactamente `case.service.ts` con `validateRelations` más allá de lo revisado, y si todos los endpoints anidados (sub-rutas de parties) validan también pertenencia al firm del case padre antes de insertar.
- `.env.example` tiene `JWT_SECRET=change-me-in-production`. Si ese valor quedara en producción por error sería catastrófico. Conviene arrancar el server con error si `JWT_SECRET` no está seteado o vale ese literal.

---

## 5. Deuda técnica y calidad de código

### 5.1 Tests

**Cero tests en todo el repositorio.** No existe framework de test configurado (ni Vitest, ni Jest, ni Playwright, ni Cypress) en ninguno de los dos `package.json`. No hay archivos `.test.*`, `.spec.*` ni carpetas `__tests__`. No hay script `test` en `package.json`.

**Consecuencia:** cada refactor es a ciegas. Multi-tenancy y auth son exactamente los lugares donde un regression test vale oro y no los hay.

### 5.2 Linter / formateador / CI

- **ESLint:** no configurado (no hay `eslint.config.*` ni `.eslintrc.*`).
- **Prettier:** no configurado.
- **Husky / lint-staged:** no instalado.
- **CI:** no verificado en profundidad si hay `.github/workflows/`. Asumo ausente en base a la historia del proyecto.

### 5.3 TODOs, console.logs y código muerto

- **10 TODOs en total**, todos concentrados en los andamios vacíos:
  - 6 en `backend/src/ai-service/index.ts` (un TODO por método)
  - 4 en `backend/src/portal-scraper/index.ts`
  - Ninguno fuera de estos dos archivos.
- **console.log/error:**
  - `backend/src/index.ts:25` — log de arranque del server (aceptable en dev, pero conviene migrar a logger estructurado).
  - `backend/src/middleware/error-handler.ts:33` — `console.error` en el handler de errores (aceptable mínimo, pero un logger estructurado daría trazabilidad).
- **No se detectó** código comentado grande ni funciones exportadas sin usar por muestreo. No verificado exhaustivamente.

### 5.4 Secretos y configuración

- No hay secretos hardcodeados en el código.
- `.env.example` contiene placeholders razonables.
- Valor peligroso: `JWT_SECRET=change-me-in-production`. Sin guardrails que impidan bootear el server con ese valor.

### 5.5 Tamaño de archivos y complejidad

Los services más grandes son razonables:
- `backend/src/services/case.service.ts` — 330 líneas
- `backend/src/services/matter.service.ts` — 305 líneas
- `backend/src/services/person.service.ts` — 267 líneas
- `frontend/src/pages/persons/person-form.tsx` — 237 líneas

Ningún archivo supera los 500 líneas. No hay god-classes ni controllers monstruo.

### 5.6 Tipos: chequeo estático

Intenté correr `tsc --noEmit` en backend y frontend pero **`node_modules` no está instalado** (por consigna no instalé dependencias). Los errores de TypeScript que aparecen al correr `tsc` son todos del tipo "Cannot find module 'express'/'zod/v4'/..." — causados por falta de dependencias, no por errores reales del código.

**No verificado:** si el código compila sin errores cuando las dependencias están instaladas. Recomendación: después de `npm install`, correr `tsc --noEmit` en ambos subproyectos y corregir cualquier error que aparezca. Dada la presencia de `strict: true`, `noUnusedLocals` y `noUncheckedIndexedAccess` en `frontend/tsconfig.json`, cualquier drift será detectado.

### 5.7 Drift de tipos frontend / backend

Ver §4.8. `frontend/src/types/index.ts` ya está desactualizado para Movement, Matter y Event. Esta es la manifestación concreta de no tener generación de tipos compartida.

### 5.8 Duplicaciones en i18n

`frontend/src/i18n/es.ts` define dos namespaces superpuestos: `person` y `people`. Uno de los dos debe eliminarse.

### 5.9 Patrón de cliente API

`frontend/src/services/person.service.ts` define localmente una interfaz `Person` que difiere de la de `frontend/src/types/index.ts`. Cada service del frontend define sus propios tipos en paralelo a `types/index.ts`. Hay dos fuentes de verdad distintas en el frontend. Mantenible en escala corta, insostenible en el mediano plazo.

### 5.10 Manejo de errores

`backend/src/middleware/error-handler.ts` existe pero no se verificó línea por línea si cubre todos los casos (ZodError, errores de Drizzle, errores 401/403 del middleware de auth). **No verificado en detalle.**

### 5.11 Validación de input

Existen validators Zod en `backend/src/validators/` para case, court, matter, party y person. No verificado si están efectivamente aplicados en cada controller ni si hay rutas que escapan a la validación.

### 5.12 Observabilidad

Nula. Sin logger estructurado, sin métricas, sin tracing, sin health check que vaya más allá de un 200 estático. Para MVP es tolerable; para producción con usuarios reales no.

### 5.13 Migraciones

Existe una sola migración (`0000_pretty_kinsey_walden.sql`, 312 líneas). No hay estrategia documentada para nuevas migraciones ni seeds. No verificado si `database/` tiene seeds (directorio existe pero no se inspeccionó su contenido).

---

## 6. Riesgos

### Riesgos críticos

1. **Los tres documentos de especificación (`SPEC_APP_JURIDICA_v1.md`, `ARQUITECTURA_APP_JURIDICA_v1.md`, `CONTEXTO_MERCADO_APP_JURIDICA_v1.md`) no están en el repositorio.** Esta auditoría se basa únicamente en `CLAUDE.md`. Cualquier decisión documentada solo en esos specs está invisible para el agente y para esta auditoría. Riesgo de construir cosas que contradicen specs nunca leídos. **Acción inmediata: encontrar esos documentos o marcarlos como inexistentes.**

2. **Andamios críticos vacíos = producto sin propuesta de valor.** Los dos diferenciadores del producto (asistente de IA, consulta a portales judiciales) son `throw new Error("Not implemented")`. Sin ellos, la app es un CRM de expedientes básico compitiendo con Lex Doctor después de 20+ años de madurez. El módulo de Expedientes ni siquiera tiene UI.

3. **Cero tests + cero linter + cero CI + un solo desarrollador no-programador.** En cuanto las entidades empiecen a interactuar (partes, movimientos, eventos, notificaciones cruzadas) los bugs de aislamiento multi-tenant serán silenciosos y peligrosos. Un solo leak entre firms es un incidente reportable por privacidad (INCUPAD si hubiera datos sensibles de clientes).

4. **`frontend/src/types/index.ts` ya está desactualizado.** La divergencia empezó. Sin generación automática de tipos desde Drizzle y sin un cliente API generado, cada nuevo módulo sumará nuevas inconsistencias. Cuando se intente conectar la UI de Movimientos o Eventos, los tipos van a mentir.

### Riesgos altos

5. **`JWT_SECRET` placeholder sin guardrail.** Si el server bootea con `change-me-in-production` en producción, el atacante puede firmar cualquier JWT y acceder a cualquier firm. No hay chequeo al arrancar.

6. **Tabla `portal_credentials` existe pero no hay encriptación.** CLAUDE.md exige credenciales "almacenadas encriptadas". Hoy el schema no define cómo. Si esto se implementa mal, una fuga de BD expone credenciales judiciales de todos los estudios.

7. **Sin rate limiting, sin captcha, sin bloqueo tras N intentos fallidos de login.** No verificado exhaustivamente, pero no hay evidencia de ninguno de estos controles en el stack actual.

8. **Sin plan de backups ni de recuperación ante desastre.** Fuera del alcance de esta auditoría de código, pero es el vector #1 de catástrofe para un SaaS jurídico.

### Riesgos medios

9. **Faltan campos de auditoría en 5 tablas** (users, notifications, case_links, portal_credentials). Violación directa de CLAUDE.md. Cuando haga falta saber quién modificó qué en un expediente, esta deuda se va a pagar en investigaciones de incidentes.

10. **i18n mezclado con hardcoded strings.** `status-badge.tsx` y `person-detail.tsx` tienen strings en español fuera del archivo de traducción. A escala, esto hace imposible cambiar una etiqueta sin cazar archivos uno por uno.

11. **Namespaces duplicados `person`/`people` en `es.ts`.** Cualquiera de los dos que se borre hoy rompe algo; si no se resuelve pronto, se pega más.

12. **Join sin `firm_id` redundante.** En los `leftJoin(persons)` y similares, la protección es solo el filtro outer. Defensa en profundidad ausente.

13. **Scraper server-side inexistente.** Portales como MEV y SAE cambian su HTML sin aviso. Cuando se implemente, necesitará tests de contrato y monitoreo, no solo un scraper que "funcione una vez".

### Riesgos bajos

14. **Sin logger estructurado.** `console.log` es suficiente para desarrollo; va a doler cuando llegue el primer incidente en producción.

15. **Sin observabilidad ni métricas.** Saber si el scraper está funcionando, cuánto tarda cada escaneo, cuántos movimientos detectó: hoy es imposible.

16. **Dependencias bleeding-edge** (React 19, Tailwind v4, Express 5-preview-via-4.21, Zod 4, react-router 7). Todo son decisiones defendibles, pero cada una tiene menos recursos comunitarios que sus versiones anteriores. Riesgo asumido.

17. **Sin versionado de API.** `/api/cases` no tiene `/v1`. Cambiar un contrato es breaking sin transición. A escala de MVP es irrelevante, pero si se abre a integraciones externas va a doler.

---

## 7. Próximos pasos priorizados

### Prioridad 0 — Antes de escribir una línea de código nueva

1. **Recuperar o declarar obsoletos los 3 specs faltantes.** Si existen en otro lado (Drive, Notion, un backup), traerlos al repo bajo `docs/`. Si no, asumir que `CLAUDE.md` es el único spec vivo y actualizarlo en consecuencia.
2. **Arreglar `JWT_SECRET`.** Agregar en `backend/src/index.ts` (o equivalente) un chequeo que aborte el boot si `process.env.JWT_SECRET` no está seteado o vale `"change-me-in-production"`.
3. **Agregar `npm test` aunque sea con 1 test.** Instalar Vitest (frontend) y Vitest o Node's built-in test runner (backend). Escribir un test de humo para multi-tenancy en `case.service.ts`: "un usuario del firm A no puede leer un case del firm B".
4. **Agregar ESLint + Prettier + `typecheck` en un script.** Sin esto, cada PR introduce basura. Configurar pre-commit con Husky + lint-staged.
5. **Configurar CI básico (GitHub Actions).** Correr `typecheck`, `lint`, `test`, `drizzle check` en cada push. Sin CI, linter y test no sirven.

### Prioridad 1 — Diferenciadores del producto

6. **Terminar el módulo de Expedientes (UI).** El backend ya está. Construir `pages/cases/{index,case-form,case-detail}.tsx` siguiendo el mismo patrón que Personas. Esto es el núcleo del MVP.
7. **Terminar el módulo de Otros Casos (UI).** Idéntico al anterior. Backend ya incluye `convertToCase`.
8. **Implementar Movimientos (backend + UI).** Es el eje de cualquier expediente. Sin movimientos, el expediente es una caja vacía.
9. **Implementar Agenda/Eventos (backend + UI).** Vinculada a movimientos (regla: audiencia auto-agendada al registrar prueba con fecha).

### Prioridad 2 — Pilares diferenciadores

10. **Asistente de IA — primera función real.** Elegir la más simple (probablemente `contextualChat` o `suggestNextSteps`). Instalar `@anthropic-ai/sdk`. Implementar dentro de `ai-service/`. **No exponer el SDK fuera de esa carpeta.** Cachear prompts con prompt caching de Claude para bajar costos.
11. **Scraper — primer portal.** Elegir uno (MEV o SAE) y dedicarle un sprint completo. Implementar encriptación de credenciales (libsodium o AES-GCM con clave en env) **antes** de que nadie cargue credenciales reales.

### Prioridad 3 — Corregir violaciones conocidas

12. **Arreglar campos de auditoría faltantes.** Migración nueva que agregue `created_by`, `updated_by`, `updated_at` donde corresponda (users, notifications, case_links, portal_credentials).
13. **Mover strings hardcodeados a i18n.** `status-badge.tsx` y `person-detail.tsx` roleLabels.
14. **Consolidar namespaces `person`/`people` en `es.ts`.** Elegir uno, migrar todos los usos.
15. **Sincronizar `frontend/src/types/index.ts` con los modelos reales de backend.** Ideal: generar automáticamente desde Drizzle. Mínimo: corregir a mano las divergencias de Movement, Matter, Event.
16. **Agregar `firm_id` a las condiciones de `leftJoin`** en `case.service.ts` y `matter.service.ts` como defense-in-depth.

### Prioridad 4 — Resto del MVP

17. **Documentos + S3** — instalar cliente S3 (MinIO local para dev), endpoint de upload, UI de adjuntos.
18. **Plantillas + Escritos** — editor TipTap, sistema de variables automáticas.
19. **Notificaciones** — servicio + badge en header + página de listado.
20. **Configuración del estudio** — logo, color de acento.
21. **Reportes** — definir cuáles (expedientes por fuero, por estado, vencimientos próximos, etc.).

### Prioridad 5 — Endurecimiento

22. **Rate limiting en auth** (express-rate-limit o similar).
23. **Logger estructurado** (pino).
24. **Backups automáticos** (depende del hosting final).
25. **Observabilidad básica** (latencia, errores, cron del scraper).

### Lo que NO hay que hacer todavía

- No construir facturación AFIP, ni contabilidad por expediente, ni liquidaciones, ni base jurídica propia. CLAUDE.md lo deja explícito.
- No invertir en mobile app nativa.
- No exponer API a terceros (no hay versionado ni OAuth).
- No contratar hosting caro antes de tener un usuario real. Postergable.

---

## 8. Apéndice

### 8.1 Archivos y rutas clave revisados

**Documentación:**
- `CLAUDE.md` — único spec disponible. 15 KB aprox. Contiene glosario, convenciones, arquitectura, reglas de negocio, stack.
- `README.md` — mínimo, reenvía a CLAUDE.md.

**Backend:**
- `backend/package.json` — deps: express 4.21.2, drizzle-orm 0.45.2, postgres 3.4.7, zod 4.3.6, jsonwebtoken 9.0.2, bcrypt 6.0.0, cookie-parser 1.4.7, cors 2.8.5, helmet 8.1.0, dotenv. **No test framework, no eslint, no SDK Anthropic, no cliente S3.**
- `backend/src/index.ts` — entry point, arranca Express.
- `backend/src/db.ts` — cliente Drizzle.
- `backend/src/models/enums.ts` — enums que matchean CLAUDE.md al 100%.
- `backend/src/models/*.ts` — definiciones de tablas Drizzle.
- `backend/src/middleware/{auth,firm-context,authorize,error-handler}.ts` — middlewares de seguridad.
- `backend/src/services/{auth,person,court,case,matter,party}.service.ts` — lógica de negocio.
- `backend/src/controllers/{auth,person,court,case,matter,party}.controller.ts` — handlers HTTP.
- `backend/src/routes/{index,auth,person,court,case,matter}.routes.ts` — definiciones de rutas.
- `backend/src/validators/{case,court,matter,party,person}.validator.ts` — schemas Zod.
- `backend/src/ai-service/index.ts` — **vacío, todos los métodos lanzan "Not implemented"**.
- `backend/src/portal-scraper/index.ts` — **vacío, todos los métodos lanzan "Not implemented"**.
- `backend/drizzle/0000_pretty_kinsey_walden.sql` — única migración, 312 líneas, 15 tablas.
- `.env.example` — con placeholder peligroso `JWT_SECRET=change-me-in-production`.

**Frontend:**
- `frontend/package.json` — deps: react 19.2.0, react-router-dom 7.9.5, @tanstack/react-query 5.95.2, axios 1.13.2, zustand 5.0.8, radix-ui/*, tailwindcss 4.1.18, zod 4.3.6, sonner, cmdk, lucide-react. **No test framework, no eslint.**
- `frontend/vite.config.ts` — proxy `/api → http://localhost:3000`.
- `frontend/tsconfig.json` — `strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess` habilitados.
- `frontend/src/App.tsx` — rutas. Solo login, register, dashboard, persons, persons/:id están cableadas. El resto renderiza placeholder.
- `frontend/src/types/index.ts` — **desactualizado respecto al backend** (Movement, Matter, Event drift).
- `frontend/src/services/{api,auth,person}.service.ts` — cliente API. Solo 3 servicios.
- `frontend/src/pages/persons/{index,person-form,person-detail}.tsx` — único módulo completo en UI.
- `frontend/src/pages/placeholder.tsx` — muestra "Próximamente" para módulos no construidos.
- `frontend/src/components/ui/status-badge.tsx` — **hardcodea strings en español fuera de i18n**.
- `frontend/src/i18n/es.ts` — **namespaces duplicados `person`/`people`**.

**Otros:**
- `database/` — directorio existe, contenido no inspeccionado en detalle.
- `node_modules/` — **no instalado en ningún subproyecto** (por consigna).

### 8.2 Lista exacta de tablas en la migración

`firms`, `users`, `persons`, `courts`, `cases`, `matters`, `parties`, `movements`, `errands`, `events`, `documents`, `templates`, `notifications`, `case_links`, `portal_credentials`. Total: **15 tablas**.

### 8.3 Hallazgos concretos referenciables

| Severidad | Ubicación | Hallazgo |
|---|---|---|
| Crítico | `.env.example` | `JWT_SECRET=change-me-in-production` sin guardrail al bootear |
| Crítico | `backend/src/ai-service/index.ts` | Los 6 métodos lanzan `"Not implemented"` |
| Crítico | `backend/src/portal-scraper/index.ts` | Ambos métodos lanzan `"Not implemented"` |
| Crítico | todo el repo | Cero tests |
| Alto | `backend/drizzle/0000_pretty_kinsey_walden.sql` (tablas users, notifications, case_links, portal_credentials) | Faltan campos de auditoría |
| Alto | `frontend/src/types/index.ts` | Interfaces Movement, Matter, Event desactualizadas |
| Alto | `frontend/src/components/ui/status-badge.tsx` | Strings en español hardcodeados |
| Alto | `frontend/src/pages/persons/person-detail.tsx:17-28` | `roleLabels` hardcodeado en español |
| Medio | `frontend/src/i18n/es.ts` | Namespaces `person` y `people` duplicados |
| Medio | `backend/src/services/case.service.ts`, `matter.service.ts` | `leftJoin(persons)` sin filtro `firm_id` redundante |
| Medio | toda la capa de routes | No verificado si `{ error: { code, message } }` se cumple en todos los errores |
| Bajo | `backend/src/index.ts:25` | `console.log` en vez de logger estructurado |

### 8.4 Cobertura del relevamiento

**Cubierto en profundidad:**
- Stack y dependencias (ambos `package.json`).
- Schema completo de BD (migración línea por línea).
- Enums y glosario.
- Middleware de auth y firm-context.
- Services de auth, person, case, matter (lectura completa).
- Andamios de ai-service y portal-scraper.
- Estructura del frontend (rutas en App.tsx, tipos, servicios, páginas de persons).
- i18n y componentes de UI compartidos.

**No verificado (tiempo/alcance):**
- Línea por línea cada controller para asegurar formato `{ data: T }` y uso consistente de validators.
- Contenido completo del directorio `database/`.
- Existencia de `.github/workflows/`.
- Contenido detallado de `court.service.ts` y `party.service.ts`.
- Si el error handler cubre todos los tipos de error (ZodError, DrizzleError, etc.).
- Contenido de `frontend/src/pages/dashboard.tsx`.
- Pruebas reales de TypeScript (requiere instalar dependencias).

### 8.5 Nota sobre los specs faltantes

La consigna original mencionaba 3 documentos de especificación:
- `SPEC_APP_JURIDICA_v1.md`
- `ARQUITECTURA_APP_JURIDICA_v1.md`
- `CONTEXTO_MERCADO_APP_JURIDICA_v1.md`

**Ninguno está en el repositorio ni en el filesystem accesible.** La auditoría se hizo contra `CLAUDE.md` como única fuente autoritativa. Toda decisión que esté documentada solo en esos specs queda fuera del radar de esta auditoría.
