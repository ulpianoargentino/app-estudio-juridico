# `shared/` — Contrato de API como fuente de verdad

Esta carpeta contiene los **schemas Zod** que describen el contrato entre el backend y el frontend. Desde acá se derivan los tipos TypeScript que consumen ambos proyectos.

> **Regla de oro:** `shared/` solo puede importar de `zod`. Nada de `drizzle-orm`, `express`, `react`, SDKs, ni utilitarios específicos de un lado. Si un archivo de `shared/` tiene que importar otra cosa, está mal ubicado.

## Por qué vive acá

Antes, `frontend/src/types/index.ts` y `backend/src/validators/*.ts` estaban desincronizados. Cualquier cambio en el schema Drizzle había que propagarlo a mano. Resultado: el frontend tenía tipos a los que les faltaban 9 de 20 campos en `Case`, y campos inexistentes en `Matter`.

La solución: un único lugar donde se define la forma de cada request y response, y ambos proyectos lo consumen.

## Qué no vive acá

- **Schemas de base de datos**: viven en `backend/src/models/` (Drizzle). El shape de DB ≠ shape de API: hay campos ocultos (`password_hash`), fechas que viajan como string en JSON, joins y campos calculados.
- **Lógica de negocio**: no. Solo definiciones de shape.
- **Utilidades del frontend o del backend**: no. Van en su lado.

## Cómo se importa

Tanto `backend` como `frontend` tienen configurado el alias `@shared`:

```ts
// desde backend/src/controllers/case.controller.ts
import { createCaseSchema, caseResponseSchema } from "@shared/schemas/case";

// desde frontend/src/services/case.service.ts
import type { Case, CreateCaseInput } from "@shared/types";
```

El alias se resuelve por:
- `backend/tsconfig.json` + `tsconfig-paths` (runtime con ts-node)
- `frontend/tsconfig.json` + `frontend/vite.config.ts` (build/dev con Vite)

## Convenciones de los schemas

Por cada dominio se exportan tres schemas mínimos:

- `xCreateSchema` — body del `POST /api/x`. Excluye campos que pone el backend (`id`, `firmId`, audit).
- `xUpdateSchema` — body del `PUT /api/x/:id`. Casi siempre `xCreateSchema.partial()`.
- `xResponseSchema` — shape que devuelve el backend al GET. Incluye todos los campos visibles al usuario.

Reglas de tipado dentro de los response schemas:

- **Fechas**: `z.string().datetime({ offset: true })` — ISO 8601 con timezone, no `z.date()`. Motivo: JSON transporta fechas como string.
- **Decimales** (`numeric` de Postgres): `z.string()`. El driver `postgres-js` los devuelve como string; el frontend parsea al presentar.
- **UUIDs**: `z.string()` (no `z.uuid()`). El proyecto usa UUIDv7 y algunos validadores de Zod son estrictos con v4.
- **Paginación**: usar `paginatedSchema(itemSchema)` de `common.ts`. El envelope sigue el formato real del backend: `{ data, meta: { total, page, limit, totalPages } }`.

## Zod v4

El proyecto usa Zod v4. En el backend se importa como `import { z } from "zod/v4"`. En `shared/` usamos el mismo estilo para que un archivo copiado entre proyectos funcione igual.
