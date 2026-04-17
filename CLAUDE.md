# CLAUDE.md — App Jurídica

> Instrucciones del proyecto para Claude Code. Leer este archivo antes de cada tarea.

---

## Visión del Proyecto

SaaS de gestión jurídica integral para abogados argentinos. Combina gestión de expedientes (inspirado en Lex Doctor), asistencia con IA (API de Claude) y consulta automática de portales judiciales. Construido por un fundador solo (abogado, no programador) usando Claude Code.

**Estado actual:** en desarrollo activo. Autenticación + multi-tenancy funcionales. Backend CRUD completo para 6 dominios (auth, personas, juzgados, expedientes, otros casos, partes). UI solo tiene login/register/dashboard; el resto son placeholders. Los dos diferenciales del producto (asistente de IA y scraper de portales) son stubs sin implementar.

---

## Documentos de referencia

Hay 3 documentos de especificación en [docs/](docs/) que describen el producto, la arquitectura y el mercado. Leerlos cuando la tarea en curso los requiera.

- [docs/SPEC_APP_JURIDICA_v1.md](docs/SPEC_APP_JURIDICA_v1.md) — Especificación funcional del producto: visión, público, alcance, MVP (10 funcionalidades), fueros, modelo freemium.
- [docs/ARQUITECTURA_APP_JURIDICA_v1.md](docs/ARQUITECTURA_APP_JURIDICA_v1.md) — Decisiones técnicas: stack, capa de abstracción del LLM, scraper, multi-tenancy, estados predefinidos.
- [docs/CONTEXTO_MERCADO_APP_JURIDICA_v1.md](docs/CONTEXTO_MERCADO_APP_JURIDICA_v1.md) — Contexto de mercado: fundador, competencia (Lex Doctor, LitigarOnline, Paralegal.ar), portales judiciales por jurisdicción.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript |
| Backend | Node.js + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Drizzle ORM (con `drizzle-kit` para migraciones) |
| Librería UI | shadcn/ui + Tailwind v4 |
| Cliente HTTP (frontend) | axios 1.14 |
| Estado cliente (frontend) | PENDIENTE — Zustand, Context y React Query están instalados pero sin patrón consistente |
| Editor de texto rico | PENDIENTE (ninguno instalado) |
| Almacenamiento de archivos | Compatible con S3 (S3, MinIO o Cloudflare R2). SDK: PENDIENTE (ningún SDK instalado aún) |
| IA | API de Anthropic (Claude) vía capa de abstracción |
| Hosting | PENDIENTE |
| Repositorio | GitHub |

**Arquitectura:** Monolito modular. Un solo servidor Node.js con módulos bien separados internamente. Sin microservicios.

**Multi-tenancy:** Base de datos compartida, aislamiento por columna `firm_id` en todas las tablas. Cada consulta DEBE filtrar por el estudio del usuario autenticado. Ningún usuario puede ver datos de otro estudio.

---

## Decisiones técnicas ya tomadas

- Framework backend: Express 4.21
- Driver PostgreSQL: `postgres` (postgres-js), no `pg`
- Autenticación: JWT en cookie httpOnly + bcrypt
- Validación: Zod v4 (importado como `zod/v4`)
- Claves primarias: UUIDv7 en columnas `text` (ver `backend/src/utils/uuid.ts`)
- Middleware de seguridad: helmet + cors + cookie-parser
- Frontend: React 19 + Vite 6 + TypeScript 5.7
- Manejo de formularios: `react-hook-form` 7.72 + `@hookform/resolvers` 5.2 instalados. Adopción pendiente (todavía no hay forms reales de dominio)
- Tema claro/oscuro: implementado vía `theme-context`
- i18n: archivo único en español en `frontend/src/i18n/es.ts`
- Contrato de API: schemas Zod en `shared/` como única fuente de verdad (ver sección "Tipos compartidos")

---

## Tipos compartidos (`shared/`)

La carpeta [shared/](shared/) define el contrato entre backend y frontend con **schemas Zod como fuente de verdad**. Los tipos TypeScript se derivan con `z.infer` — no se escriben a mano en ningún lado.

**Regla de oro:** `shared/` solo puede importar de `zod`. Nada de Drizzle, Express, React ni SDKs. Si un archivo de `shared/` necesita otra cosa, está mal ubicado.

### Estructura

```
shared/
├── schemas/
│   ├── common.ts       # paginatedSchema, errorResponseSchema, idParamSchema
│   ├── enums.ts        # enums del dominio (CaseStatus, PartyRole, JurisdictionType, ...)
│   ├── firm.ts
│   ├── user.ts
│   ├── auth.ts         # loginRequest, registerRequest, authUser
│   ├── person.ts       # personCreate/Update/Query/Response + PersonSearchResult
│   ├── court.ts
│   ├── case.ts
│   ├── matter.ts
│   └── party.ts
├── types/
│   └── index.ts        # re-export de tipos `z.infer` agrupados
├── index.ts            # barrel público
└── README.md
```

### Alias `@shared`

Ambos proyectos importan desde `@shared`:

```ts
// backend/src/controllers/case.controller.ts
import { caseCreateSchema, caseQuerySchema } from "@shared";
import { formatZodError } from "../utils/zod-error";

// frontend/src/services/auth.service.ts
import type { AuthUser, RegisterRequest } from "@shared";
```

El alias se resuelve en:
- **Dev backend** (`npm run dev`): `backend/tsconfig.json` + `tsconfig-paths/register` cargado por `ts-node`.
- **Build backend** (`npm run build`): `tsc && tsc-alias -p tsconfig.build.json`. `tsconfig.build.json` extiende el tsconfig principal pero deja sólo el alias `@shared` para que `tsc-alias` no toque los imports de `zod/v4` (que viven en `backend/node_modules/zod` y se resuelven por Node). Emite a `dist/backend/src/` + `dist/shared/`.
- **Frontend** (Vite dev + build): `frontend/tsconfig.json` + alias en `frontend/vite.config.ts`.

### Convenciones

Por cada dominio se exportan (como mínimo):
- `xCreateSchema` — body del `POST`. Excluye `id`, `firmId`, auditoría.
- `xUpdateSchema` — body del `PUT`. Típicamente `xCreateSchema.partial()`.
- `xQuerySchema` — query string del `GET` (filtros, paginación, orden).
- `xResponseSchema` — shape de respuesta del backend (con todos los campos visibles).

Reglas de tipado:
- **Fechas**: `z.string().datetime({ offset: true })` (ISO 8601 con TZ). JSON transporta fechas como string.
- **Decimales Postgres** (`numeric`): `z.string()`. `postgres-js` los devuelve como string; el frontend parsea al presentar.
- **UUIDs**: `z.string()` genérico (el proyecto usa UUIDv7; varios validadores de Zod son estrictos con v4).
- **Paginación**: usar `paginatedSchema(itemSchema)` de `common.ts`. Envelope: `{ data, meta: { total, page, limit, totalPages } }`.

### Flujo al agregar un campo

1. Actualizar el schema Drizzle en `backend/src/models/`.
2. Generar la migración (`npm run db:generate`).
3. Actualizar el schema Zod correspondiente en `shared/schemas/`.
4. Backend y frontend recompilan — los lugares que rompen son exactamente los que hay que tocar.

Nunca escribir interfaces de dominio en `backend/src/types/` ni en `frontend/src/types/`: esas carpetas existen para tipos que **no** cruzan la red (augmentación de Express, etc.).

---

## Convenciones de Idioma

### Código: en inglés

Todo el código fuente se escribe en inglés:
- Nombres de variables y funciones
- Nombres de tablas y columnas de la base de datos
- Rutas de endpoints de la API
- Nombres de archivos y carpetas del código
- Nombres de branches en Git

### Interfaz de usuario: en español

Todo lo que el usuario final ve está en español:
- Labels, botones, menúes, placeholders
- Mensajes de error mostrados al usuario
- Texto de notificaciones
- Textos de ayuda y tooltips

Usar archivos i18n para todos los textos visibles al usuario. Nunca hardcodear texto en español dentro de los componentes — siempre referenciar claves de traducción.

### Instrucciones y documentación: en español

Toda la documentación del proyecto, archivos de planificación e instrucciones dirigidas al fundador se escriben en español:
- README.md, CLAUDE.md y cualquier documento del proyecto
- Registros de decisiones de arquitectura
- Descripciones de tareas y planes
- Comentarios de código que explican el *por qué* (contexto de negocio) — en español
- Comentarios de código que explican el *qué* (implementación técnica) — en inglés

Cuando Claude Code explica lo que va a hacer, describe un plan, o escribe cualquier documento que el fundador va a leer, usar español.

### Endpoints de la API

RESTful, en inglés, sustantivos en plural:
```
GET    /api/cases
POST   /api/cases
GET    /api/cases/:id
PUT    /api/cases/:id
DELETE /api/cases/:id
GET    /api/cases/:id/movements
POST   /api/cases/:id/documents
```

---

## Glosario de Dominio

Este es el mapeo autoritativo entre el dominio jurídico argentino (español) y el código (inglés). Usar estos términos de forma consistente en todo el proyecto.

### Entidades principales

| Español (dominio) | Inglés (código) | Notas |
|---|---|---|
| Estudio jurídico | Firm | La unidad de tenant |
| Expediente | Case | Causa judicial o extrajudicial con número de expediente |
| Otro caso | Matter | Trabajo jurídico sin número formal (contratos, consultas, etc.) |
| Persona | Person / Contact | Persona física o jurídica en el directorio |
| Parte | Party | Persona vinculada a un expediente con un rol específico |
| Movimiento / Actuación | Movement | Registro cronológico de actividad del expediente |
| Gestión de procuración | Errand | Diligencias: cédulas, mandamientos, oficios, etc. |
| Escrito | Filing / Brief | Documento jurídico (demanda, contestación, recurso, etc.) |
| Modelo / Plantilla | Template | Plantilla de documento con variables automáticas |
| Documento adjunto | Document / Attachment | Archivo subido vinculado a un expediente o caso |
| Evento de agenda | Event | Evento de calendario (audiencia, vencimiento, reunión) |
| Vencimiento | Deadline | Evento con fecha límite |
| Rubro contable | Ledger item | Ítem contable por expediente (Fase 2) |
| Factura | Invoice | Factura electrónica vía AFIP (Fase 2) |
| Juzgado | Court | El tribunal que maneja el expediente |
| Secretaría | Court clerk office | Subdivisión del juzgado |
| Fuero | Jurisdiction type | Civil, Penal, Laboral, Familia, etc. |
| Jurisdicción | Jurisdiction | Geográfica: provincia, departamento judicial |
| Carátula | Case title | Formato: "ACTOR c/ DEMANDADO s/ OBJETO" |
| Cuaderno | Volume | Subdivisión del legajo (principal, incidente, etc.) |
| Foja | Page/Folio | Número de página dentro de un cuaderno |
| Cédula | Service notice | Documento de notificación judicial |
| Mandamiento | Court order writ | Orden de ejecución judicial |
| Oficio | Official letter | Comunicación entre juzgados o con organismos |
| Exhorto | Rogatory letter | Comunicación interjurisdiccional |
| Audiencia | Hearing | Audiencia judicial |
| Mediación | Mediation | Proceso de mediación prejudicial |
| Perito | Expert witness | Perito designado por el juzgado |
| Procurador | Process server | Persona que realiza diligencias judiciales |
| Caducidad | Lapse / Expiration | Extinción del expediente por inactividad |
| Prescripción | Statute of limitations | Plazo límite para iniciar una acción |

### Roles de personas (en relaciones de parte)

| Español | Inglés (enum en código) |
|---|---|
| Actor / Demandante | PLAINTIFF |
| Demandado | DEFENDANT |
| Abogado | ATTORNEY |
| Procurador | PROCESS_SERVER |
| Perito | EXPERT_WITNESS |
| Testigo | WITNESS |
| Juez | JUDGE |
| Secretario | CLERK |
| Cliente | CLIENT |
| Contraparte | OPPOSING_PARTY |

### Estados de expediente

| Español | Inglés (enum en código) |
|---|---|
| Inicio | INITIAL |
| En trámite | IN_PROGRESS |
| En prueba | EVIDENCE_STAGE |
| Alegatos | CLOSING_ARGUMENTS |
| Para sentencia | AWAITING_JUDGMENT |
| Sentencia | JUDGMENT_ISSUED |
| En ejecución | IN_EXECUTION |
| Archivado | ARCHIVED |
| Paralizado | SUSPENDED |
| Mediación | IN_MEDIATION |

### Estados de otro caso (Matter)

| Español | Inglés (enum en código) |
|---|---|
| Activo | ACTIVE |
| En espera | ON_HOLD |
| Finalizado | COMPLETED |
| Archivado | ARCHIVED |

### Fueros

| Español | Inglés (enum en código) |
|---|---|
| Civil y Comercial | CIVIL_COMMERCIAL |
| Laboral | LABOR |
| Penal | CRIMINAL |
| Familia | FAMILY |
| Contencioso Administrativo | ADMINISTRATIVE |
| Cobros y Apremios | COLLECTIONS |
| Sucesiones | PROBATE |
| Extrajudicial | EXTRAJUDICIAL |

---

## Estructura del Proyecto

```
app-juridica/
├── shared/                  # Contrato de API (schemas Zod → tipos TS). Alias: @shared
│   ├── schemas/             # Un archivo por dominio: auth, person, court, case, matter, party, ...
│   ├── types/               # Tipos z.infer agrupados
│   ├── index.ts             # Barrel público
│   └── README.md
├── frontend/                # React + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes UI reutilizables
│   │   ├── pages/           # Vistas por módulo
│   │   ├── services/        # Llamadas al API (consumen tipos desde @shared)
│   │   ├── contexts/        # Estado global (auth, tema, etc.)
│   │   ├── hooks/           # Hooks personalizados de React
│   │   ├── i18n/            # Archivos de traducción (español)
│   │   ├── types/           # Re-export de @shared (compat histórica) — no definir tipos de dominio acá
│   │   └── utils/           # Funciones auxiliares
├── backend/                 # Node.js + TypeScript
│   ├── src/
│   │   ├── routes/          # Definiciones de endpoints
│   │   ├── controllers/     # Validan con schemas Zod importados de @shared
│   │   ├── models/          # Definiciones Drizzle (shape de DB, no del API)
│   │   ├── services/        # Lógica de negocio (tipos vía z.infer de @shared)
│   │   ├── ai-service/      # Capa de abstracción del LLM (ver abajo)
│   │   ├── portal-scraper/  # Servicio de scraping de portales judiciales
│   │   ├── middleware/      # Auth, validación, manejo de errores
│   │   ├── types/           # Augmentación de Express (express.ts) — NO tipos de dominio
│   │   └── utils/           # uuid.ts (UUIDv7), zod-error.ts (formato de errores 400)
├── database/                # Migraciones y seeds (actualmente las migraciones viven en backend/drizzle/)
├── CLAUDE.md                # Este archivo
└── README.md
```

---

## Reglas de Arquitectura

### Multi-Tenancy

Toda tabla de la base de datos que almacena datos de usuario DEBE tener una columna `firm_id`. Toda consulta DEBE incluir `WHERE firm_id = ?` usando el estudio del usuario autenticado. Sin excepciones.

```typescript
// CORRECTO
const cases = await db.cases.findMany({ where: { firmId: user.firmId, status: 'IN_PROGRESS' } });

// MAL — nunca hacer esto
const cases = await db.cases.findMany({ where: { status: 'IN_PROGRESS' } });
```

### Capa de abstracción de IA

El resto de la aplicación NUNCA llama directamente a la API de Anthropic. Todas las llamadas pasan por `ai-service/`, que expone funciones de negocio:

```typescript
// CORRECTO — función de negocio
const draft = await aiService.generateFiling(caseData, templateId, filingType);

// MAL — llamada directa desde un controller o service
const response = await anthropic.messages.create({ ... });
```

Funciones expuestas por ai-service:
- `generateFiling()` — Genera borrador de escrito judicial a partir de datos del expediente y plantilla
- `analyzeDocument()` — Analiza un documento subido
- `searchJurisprudence()` — Búsqueda semántica de jurisprudencia relevante
- `suggestNextSteps()` — Sugiere acciones procesales según el estado del expediente
- `alertExpiration()` — Detecta riesgo de caducidad/prescripción
- `contextualChat()` — Chat libre con contexto del expediente

El asistente de IA tiene acceso a herramientas (tools) para consultar la base de datos:
- `searchCases` — Buscar expedientes por criterios
- `getCaseDetail` — Datos completos de un expediente
- `listMovements` — Movimientos de un expediente
- `queryCalendar` — Eventos próximos
- `searchPerson` — Búsqueda en el directorio

### Scraper de portales judiciales

Corre del lado del servidor (nunca en el navegador del usuario). Consulta periódicamente los portales judiciales con las credenciales del usuario (almacenadas encriptadas). Compara los resultados con los datos de la app y crea movimientos + notificaciones cuando detecta novedades.

Portales objetivo (Fase 1):
- MEV (mev.scba.gov.ar) — Provincia de Buenos Aires
- Portal del SAE (portaldelsae.justucuman.gov.ar) — Tucumán

### Autenticación

- Registro con email + contraseña (sin login social por ahora)
- JWT en cookie httpOnly, 7 días de expiración, firmado con `JWT_SECRET`
- Dos roles para el MVP: `ADMIN` (acceso total + configuración del estudio) y `USER` (acceso estándar)
- El primer usuario que se registra crea el estudio y queda como ADMIN

### Campos de auditoría

Toda tabla incluye estas columnas desde el día uno:
- `created_by` — ID del usuario que creó el registro
- `created_at` — Timestamp de creación
- `updated_by` — ID del último usuario que modificó
- `updated_at` — Timestamp de última modificación

---

## Convenciones de Base de Datos

- Nombres de tablas: inglés, plural, snake_case (`cases`, `parties`, `movements`)
- Nombres de columnas: inglés, snake_case (`case_title`, `court_id`, `firm_id`)
- Claves primarias: columna `id` de tipo `text` con UUIDv7 generado por `backend/src/utils/uuid.ts`
- Claves foráneas: `{tabla_referenciada_singular}_id` (ej: `case_id`, `person_id`, `firm_id`)
- Enums: UPPER_SNAKE_CASE (`IN_PROGRESS`, `PLAINTIFF`, `CIVIL_COMMERCIAL`)
- Booleanos: prefijo `is_` o `has_` (`is_active`, `has_digital_signature`)
- Timestamps: sufijo `_at` (`created_at`, `filed_at`, `due_at`)
- Todas las fechas se almacenan en UTC, se convierten a zona horaria Argentina (America/Argentina/Buenos_Aires) en el frontend

---

## Convenciones de API

- Endpoints RESTful, en inglés, sustantivos en plural
- Formato de respuesta exitosa: `{ data: T }`
- Formato de respuesta con error: `{ error: { code: string, message: string } }`
- Códigos HTTP: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
- Paginación: `?page=1&limit=20` → la respuesta incluye `{ data: T[], meta: { total, page, limit, totalPages } }`
- Filtros: query params (`?status=IN_PROGRESS&jurisdictionType=CIVIL_COMMERCIAL`)
- Ordenamiento: `?sort=created_at&order=desc`

---

## Guías de UI/UX

- Modo claro y oscuro con toggle para que el usuario elija
- Diseño limpio, moderno, profesional — sin estética genérica de IA
- Personalización por estudio: subir logo + elegir color de acento
- Navegación en sidebar: Dashboard, Expedientes, Otros Casos, Personas, Agenda, Escritos, Reportes, Configuración
- Header: fecha, badge de notificaciones, acceso al asistente de IA, perfil de usuario
- Responsive: sidebar colapsable en móvil, scroll horizontal en tablas
- Librería de componentes: shadcn/ui (configurado en `frontend/components.json`). Todos los nuevos componentes deben usar esta librería.
- Editor de texto enriquecido: PENDIENTE DE ELEGIR. Decisión bloqueante para el módulo de Escritos/Plantillas.

---

## Estado actual por módulo

### Módulos funcionales del MVP

| Módulo | Estado | Notas |
|---|---|---|
| Autenticación + Firms + Users | **COMPLETO** | Backend + UI (login/register/protected-route). JWT cookies httpOnly, 7 días |
| Expedientes (Cases) | **BACKEND COMPLETO** | Service + controller + routes con summary. UI `/cases` es placeholder |
| Otros Casos (Matters) | **BACKEND COMPLETO** | Incluye endpoint `/convert` (crea Case y copia parties, movements, documents, events transaccional). UI placeholder |
| Directorio de Personas | **BACKEND COMPLETO** | CRUD + `/search`. UI placeholder. `PersonSelect` ya disponible para forms |
| Partes (Parties) | **BACKEND COMPLETO** | Sub-rutas `/:caseId/parties` y `/:matterId/parties`. Valida duplicados y pertenencia al firm. Sin UI |
| Juzgados (Courts) | **BACKEND COMPLETO** | CRUD. Sin UI |
| Agenda y Eventos | **SOLO SCHEMA** | Tabla `events` definida; falta service/controller/route/UI. Regla de auto-agendar audiencias (§Reglas de Negocio Clave #5) sin implementar |
| Movimientos / Actuaciones | **SOLO SCHEMA** | Tabla con check constraint XOR case/matter. Sin service/controller/route/UI |
| Gestiones de Procuración (Errands) | **SOLO SCHEMA** | Tabla definida |
| Gestión Documental (Documents) | **SOLO SCHEMA** | Tabla definida con FK a case/matter/movement. Ningún SDK de storage S3 instalado |
| Plantillas de Escritos (Templates) | **SOLO SCHEMA** | Tabla con `content` y `variables`. Editor rich-text no instalado |
| Reportes / Estadísticas | **SIN EMPEZAR** | Solo existe `case.service.getCaseSummary()` por status. Sin UI |
| Consulta de Portales Judiciales | **STUB** | `backend/src/portal-scraper/index.ts` → `throw new Error("Not implemented")`. Sin librería de scraping instalada. Encriptación de credenciales no implementada |
| Asistente de IA | **STUB** | `backend/src/ai-service/index.ts` → 6 métodos `throw new Error("Not implemented")`. SDK `@anthropic-ai/sdk` no instalado. Sin tools de DB |

### Infraestructura auxiliar

| Tabla | Estado | Notas |
|---|---|---|
| `case_links` | **SOLO SCHEMA** | Vincula expedientes relacionados (conexos, acumulados, incidentes). Faltan `updated_by` y `updated_at` |
| `notifications` | **SOLO SCHEMA** | Tabla definida, sin endpoints. Campana `<Bell/>` en header sin datos. Faltan `updated_at`, `created_by`, `updated_by` |
| `portal_credentials` | **SOLO SCHEMA** | Tabla con `username_encrypted`/`password_encrypted`. Sin código de encriptación. Faltan `created_by`, `updated_by` |

**IMPORTANTE:** actualizar estas tablas cada vez que se complete un módulo, para que no se desactualicen.

---

## Lo que NO se construye (Fase 2 / Futuro)

No implementar nada de esto salvo que se pida explícitamente:
- Contabilidad por expediente (rubros, cálculo de intereses)
- Facturación electrónica AFIP
- Liquidaciones judiciales con tasas de interés
- Caja (ingresos/egresos)
- Base jurídica propia (legislación/jurisprudencia)
- Operaciones masivas sobre múltiples expedientes
- Portal de clientes (que los clientes consulten sus expedientes)
- App móvil nativa
- Integración con Bus Federal de Justicia
- Firma digital
- Correo electrónico integrado

---

## Reglas de Negocio Clave

1. Un **Matter** (otro caso) puede convertirse en un **Case** (expediente) si se judicializa. La conversión debe preservar todo el historial (movimientos, documentos, notas, partes).

2. Los **Cases** tienen campos específicos del proceso judicial (juzgado, secretaría, fuero, cuaderno, foja) y consulta de portales. Los **Matters** no.

3. Tanto Cases como Matters comparten: partes vinculadas, eventos de agenda, movimientos/actividad, documentos, acceso al asistente de IA.

4. Una **Person** puede estar vinculada a muchos Cases y Matters con distintos roles en cada uno.

5. Cuando se registra una prueba con fecha de audiencia, la audiencia DEBE auto-agendarse en el calendario.

6. El sistema soporta TODOS los fueros desde el día uno (Civil, Penal, Laboral, Familia, Contencioso Administrativo, Cobros y Apremios, Sucesiones, Extrajudicial).

7. El número de expediente varía según jurisdicción y juzgado. El campo es texto libre, no se valida contra un patrón.

8. La carátula sigue la convención "ACTOR c/ DEMANDADO s/ OBJETO" pero se almacena como texto libre.

---

## Jurisdicciones Objetivo (Fase 1)

- **Provincia de Buenos Aires** — Departamento Judicial de Bahía Blanca. Portal: MEV (mev.scba.gov.ar)
- **Tucumán** — Portal del SAE (portaldelsae.justucuman.gov.ar)

La arquitectura debe permitir agregar nuevas jurisdicciones provinciales sin rediseño. Cada provincia tiene sus propios portales, fueros y convenciones.

---

## Flujo de Desarrollo

- Una feature/módulo a la vez
- Cada módulo: migración de base de datos → API del backend → UI del frontend → tests
- Verificar que cada módulo funciona antes de avanzar al siguiente
- Git: feature branches, commits descriptivos en inglés

---

## Problemas conocidos

- Las columnas `username_encrypted` y `password_encrypted` en `portal_credentials` tienen ese nombre pero **no hay código de encriptación implementado**. Encriptar antes de guardar es requisito de seguridad pendiente.
- Las tablas `notifications`, `case_links` y `portal_credentials` no tienen todos los campos de auditoría que exige este mismo documento. Corregir en la próxima migración.
- No hay tests, linter ni CI configurados.
- Los scripts `main` y `start` de `backend/package.json` apuntan a `dist/backend/src/index.js`. El layout anidado viene de que, al eliminar `rootDir` para poder importar `../shared`, TypeScript infiere la raíz común y emite bajo `dist/backend/src/` + `dist/shared/`. Los imports de `@shared` se reescriben en el build con `tsc-alias` (ver sección "Tipos compartidos").
