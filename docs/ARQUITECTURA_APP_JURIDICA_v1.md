# APP JURÍDICA — Decisiones Técnicas y Arquitectura

**Versión:** 1.0
**Fecha:** 28 de marzo de 2026
**Estado:** Actualizado 2026-04-16 para alinear con el estado real del código.

> Este documento refleja la arquitectura vigente. Para decisiones y convenciones operativas del día a día, ver [CLAUDE.md](../CLAUDE.md).

---

## 1. Stack tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React con TypeScript | Ecosistema maduro, amplia comunidad, Claude Code lo maneja muy bien |
| **Backend** | Node.js | Mismo lenguaje que el frontend (TypeScript), simplifica el desarrollo |
| **Base de datos** | PostgreSQL | Robusta, escalable, soporte nativo de JSON, full-text search, gratuita |
| **ORM** | Pendiente de definición (Prisma o Drizzle) | Type-safe, migraciones automáticas |
| **Almacenamiento de archivos** | Servicio cloud (S3, MinIO o similar) | Para documentos, imágenes y PDFs adjuntos |
| **IA** | API de Anthropic (Claude) vía capa de abstracción | Ver sección 7 |
| **Hosting** | Nube — servicio pendiente de definición | Railway, Vercel, Fly.io o similar |
| **Repositorio** | GitHub | Código versionado, deploy automatizable |
| **Desarrollo** | Claude Code (terminal, desktop o web) | Constructor principal del proyecto |

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────┐
│                   NAVEGADOR                      │
│              (React + TypeScript)                │
│         Interfaz del abogado / usuario           │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────────┐
│                 API REST (Node.js)               │
│                                                  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Expedientes│ │ Personas   │ │ Agenda       │ │
│  │ y Casos    │ │            │ │              │ │
│  ├────────────┤ ├────────────┤ ├──────────────┤ │
│  │ Movimientos│ │ Documentos │ │ Gestiones    │ │
│  ├────────────┤ ├────────────┤ ├──────────────┤ │
│  │ Escritos   │ │ Reportes   │ │ Auth         │ │
│  ├────────────┤ ├────────────┤ ├──────────────┤ │
│  │ Servicio   │ │ Scraper    │ │ Notificac.   │ │
│  │ de IA      │ │ Portales   │ │              │ │
│  └────────────┘ └────────────┘ └──────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴───────┐ ┌────┴────┐ ┌──────┴──────┐
│  PostgreSQL   │ │ Storage │ │ API Claude  │
│  (datos)      │ │ (docs)  │ │ (IA)        │
└───────────────┘ └─────────┘ └─────────────┘
```

**Tipo:** Monolito modular. Un solo servidor Node.js con módulos bien separados internamente. No microservicios — sería sobreingeniería para esta etapa.

**Multi-tenancy:** Base de datos compartida con aislamiento por columna `estudio_id` en todas las tablas. Cada consulta filtra por el estudio del usuario autenticado. Ningún usuario puede acceder a datos de otro estudio.

---

## 3. Modelo de datos (alto nivel)

### Entidades principales

```
ESTUDIOS (tenants)
├── USUARIOS (pertenecen a un estudio)
├── PERSONAS (directorio de contactos del estudio)
├── EXPEDIENTES (causas judiciales y extrajudiciales)
│   ├── PARTES (personas vinculadas con rol)
│   ├── MOVIMIENTOS (actuaciones procesales)
│   ├── GESTIONES (diligencias de procuración)
│   ├── DOCUMENTOS (archivos adjuntos)
│   └── EVENTOS_AGENDA (vinculados al expediente)
├── OTROS_CASOS (trabajo sin actuación formal)
│   ├── PARTES (personas vinculadas con rol)
│   ├── ACTIVIDAD (registro de actividad libre)
│   ├── DOCUMENTOS (archivos adjuntos)
│   └── EVENTOS_AGENDA (vinculados al caso)
├── AGENDA (eventos generales no vinculados)
├── MODELOS_ESCRITOS (plantillas de documentos)
└── CONFIGURACIÓN (estados, tipos de proceso, etc.)
```

### Relaciones clave

- Un **estudio** tiene muchos **usuarios**, **personas**, **expedientes**, **otros casos**.
- Un **expediente** tiene muchas **partes**, **movimientos**, **gestiones**, **documentos**, **eventos**.
- Un **otro caso** tiene muchas **partes**, **actividad**, **documentos**, **eventos**.
- Una **persona** puede estar vinculada a muchos expedientes y casos con distintos roles.
- Un **otro caso** puede convertirse en **expediente** (con migración de historial).

### Campos de auditoría (en todas las tablas)

Aunque no es prioridad para el MVP, desde el inicio todas las tablas incluyen:
- `created_by` (usuario que creó el registro)
- `created_at` (fecha/hora de creación)
- `updated_by` (último usuario que modificó)
- `updated_at` (fecha/hora de última modificación)

Esto no cuesta nada incluirlo desde el principio y evita tener que migrarlo después.

---

## 4. Autenticación y autorización

- **Registro:** Email + contraseña. Sin login social (Google/Microsoft) por ahora.
- **Sesión:** JWT (JSON Web Token) o sesiones server-side. Decisión a definir en implementación.
- **Roles (MVP):** Dos niveles:
  - **Administrador del estudio:** Puede todo. Gestiona usuarios, configuración.
  - **Usuario estándar:** Puede gestionar expedientes, casos, personas, agenda, documentos. No puede administrar usuarios ni configuración del estudio.
- **Roles avanzados:** Pendiente para fase 2 (más niveles, permisos granulares).
- **Registro de estudio:** Al registrarse, el primer usuario crea el estudio y queda como administrador. Puede invitar a otros usuarios.

---

## 5. Idioma

- **Interfaz:** Todo en español (menúes, botones, mensajes, labels, placeholders). Centralizar en archivos i18n — nunca hardcodear strings en español dentro de componentes.
- **Código fuente:** Todo en inglés (nombres de variables, funciones, tablas, columnas, rutas, archivos, carpetas, branches).
- **Comentarios:** Los que explican el *por qué* (contexto de negocio) en español; los que explican el *qué* (implementación técnica) en inglés.
- **API:** Endpoints y campos en inglés (ej: `/api/cases`, `/api/persons`, campo `caseTitle`).
- **Documentación del proyecto:** En español (README, CLAUDE.md, este documento, planes, decisiones de arquitectura).

Ver [CLAUDE.md](../CLAUDE.md) → sección "Convenciones de Idioma" para el detalle normativo.

---

## 6. Interfaz de usuario

### Tema visual
- **Light y dark mode** con toggle para que el usuario elija.
- Diseño limpio, moderno, profesional. Sin estética genérica de IA.
- El prototipo generado en la conversación inicial sirve como referencia visual (tema oscuro).

### Personalización por estudio
- Cada estudio puede subir su **logo**.
- Cada estudio puede elegir **colores** del tema (color primario/acento).
- El logo aparece en el sidebar y en los documentos generados.

### Navegación
- **Sidebar** con los módulos principales: Dashboard, Expedientes, Otros Casos, Personas, Agenda, Escritos, Reportes, Configuración.
- **Header** con: fecha, notificaciones, acceso al asistente de IA, perfil de usuario.
- **Responsive:** Sidebar colapsable en móvil, tablas con scroll horizontal.

### Componentes UI
- Librería de componentes: pendiente de definición (shadcn/ui, Ant Design u otra).
- Editor de texto enriquecido: pendiente de definición (TipTap, Plate u otro).

---

## 7. Capa de abstracción del LLM

### Principio
El resto de la aplicación nunca llama directamente a la API de ningún proveedor de IA. Todo pasa por un módulo intermedio (`ai-service`) que expone funciones de negocio.

### Funciones expuestas

| Función | Qué hace | Contexto que recibe |
|---------|----------|-------------------|
| `generateFiling()` | Genera borrador de escrito judicial | Datos del expediente, partes, tipo de escrito, modelo/plantilla |
| `analyzeDocument()` | Analiza un documento subido | Contenido del documento, datos del expediente |
| `searchJurisprudence()` | Busca jurisprudencia relevante | Tema, fuero, palabras clave, contexto del caso |
| `suggestNextSteps()` | Sugiere acciones procesales | Estado del expediente, movimientos recientes, tipo de proceso |
| `alertExpiration()` | Detecta riesgo de caducidad/prescripción | Fechas del expediente, último movimiento, tipo de proceso |
| `contextualChat()` | Chat libre con contexto del caso | Datos del expediente o caso activo, historial de chat |

### Implementación interna
- Cada función arma el prompt adecuado, define las herramientas (tools) necesarias, llama a la API del LLM, y procesa la respuesta.
- **Proveedor inicial:** Claude (API de Anthropic).
- **Cambio de proveedor:** Solo requiere modificar este módulo. El resto de la app no se toca.

### Herramientas (tools) del asistente
El asistente de IA tiene acceso a estas herramientas para consultar datos reales:
- `searchCases` — Busca expedientes por criterios.
- `getCaseDetail` — Trae datos completos de un expediente.
- `listMovements` — Movimientos de un expediente.
- `queryCalendar` — Eventos próximos.
- `searchPerson` — Busca en el directorio.

---

## 8. Scraper de portales judiciales

### Arquitectura
- Servicio que corre en el backend (no en el navegador del usuario).
- Se ejecuta periódicamente (frecuencia a definir — cada hora, cada 4 horas, etc.).
- Consulta los portales judiciales con las credenciales del usuario.
- Compara los datos obtenidos con lo registrado en la app.
- Si detecta novedades, actualiza los movimientos del expediente y notifica al usuario.

### Portales a integrar (Fase 1)

| Portal | Jurisdicción | URL | Autenticación |
|--------|-------------|-----|---------------|
| MEV | Buenos Aires | mev.scba.gov.ar | Usuario + contraseña |
| PyNE | Buenos Aires | notificaciones.scba.gov.ar | Certificado digital (complejo) |
| Portal del SAE | Tucumán | portaldelsae.justucuman.gov.ar | CUIT + contraseña |
| Consulta Expedientes | Tucumán | consultaexpedientes.justucuman.gov.ar | Por definir |

### Consideraciones técnicas
- La viabilidad depende del resultado de la inspección de tráfico de red (F12) de cada portal.
- Si los portales tienen API interna (probable en los que son SPA), se consume esa API.
- Si no, se usa scraping con herramientas como Puppeteer o Playwright.
- Las credenciales del usuario se almacenan encriptadas en la base de datos.
- Se debe manejar correctamente: rate limiting, sesiones expiradas, cambios en la estructura del portal, captchas.
- **Bus Federal de Justicia:** API REST documentada con sandbox. Para comunicaciones interjurisdiccionales. Fase 2.

---

## 9. Almacenamiento de documentos

- Los archivos (PDFs, imágenes, Word) NO se guardan en PostgreSQL.
- Se guardan en un servicio de almacenamiento de objetos (S3, MinIO, Cloudflare R2 o similar).
- En la base de datos se guarda la referencia (URL/path, nombre del archivo, tamaño, tipo MIME).
- Cada archivo está asociado a un estudio, un expediente o caso, y opcionalmente a un movimiento.
- Límites de almacenamiento por plan (a definir en el modelo de pricing).

---

## 10. Notificaciones

### MVP
- **Email:** Notificaciones de vencimientos de agenda y novedades detectadas en portales judiciales.
- **En la app:** Badge de notificaciones en el header con listado de eventos pendientes.

### Fase 2
- Notificaciones push en el navegador.
- Notificaciones por WhatsApp (API de WhatsApp Business).
- Resumen diario por email.

---

## 11. Estados predefinidos

### Estados de expedientes (set fijo para el MVP)
- Inicio
- En trámite
- En prueba
- Alegatos
- Para sentencia
- Sentencia
- En ejecución
- Archivado
- Paralizado
- Mediación

### Estados de otros casos (set fijo para el MVP)
- Activo
- En espera
- Finalizado
- Archivado

### Tipos de proceso predefinidos (set fijo, ejemplos)
- Daños y perjuicios
- Cobro de pesos
- Ejecución
- Despido
- Accidente de trabajo
- Sucesión
- Divorcio
- Amparo
- Desalojo
- Cobros y apremios
- Mediación
- Consulta
- Contrato
- (y otros — lista completa a definir)

**Nota:** En fase 2 se puede hacer configurable por estudio.

---

## 12. Generación de PDF

- Los escritos generados desde el editor se pueden exportar a PDF.
- Herramienta: pendiente de definición (Puppeteer, @react-pdf/renderer, o similar).
- Los PDFs generados quedan almacenados como documentos adjuntos del expediente.

---

## 13. Estructura del proyecto

```
app-estudio-juridico/
├── frontend/                  # React 19 + TypeScript + Vite 6
│   ├── src/
│   │   ├── components/        # UI reutilizables (shadcn/ui + custom)
│   │   ├── pages/             # Vistas por módulo
│   │   ├── services/          # axios client + servicios por dominio
│   │   ├── contexts/          # Estado global (auth, theme)
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── i18n/              # Traducciones (es.ts)
│   │   ├── types/             # Tipos TypeScript
│   │   └── lib/               # Utilidades (cn, etc.)
│   ├── components.json        # Configuración shadcn/ui
│   └── vite.config.ts
├── backend/                   # Node.js + TypeScript + Express 4
│   ├── src/
│   │   ├── routes/            # Definiciones de endpoints
│   │   ├── controllers/       # Handlers HTTP
│   │   ├── services/          # Lógica de negocio
│   │   ├── models/            # Schemas Drizzle de cada tabla
│   │   ├── validators/        # Schemas Zod de validación
│   │   ├── middleware/        # Auth, firm-context, error-handler
│   │   ├── types/             # Tipos compartidos
│   │   ├── utils/             # Utilidades (UUIDv7)
│   │   ├── ai-service/        # Capa de abstracción del LLM (stub)
│   │   ├── portal-scraper/    # Scraper de portales (stub)
│   │   └── config/            # Configuración por env
│   ├── drizzle/               # Migraciones + snapshots
│   └── drizzle.config.ts
├── database/                  # Reservado para seeds / scripts SQL
├── docs/                      # Especificaciones del producto
│   ├── SPEC_APP_JURIDICA_v1.md
│   ├── ARQUITECTURA_APP_JURIDICA_v1.md
│   └── CONTEXTO_MERCADO_APP_JURIDICA_v1.md
├── AUDITORIA_2026-04-16.md    # Auditoría técnica del estado actual
├── CLAUDE.md                  # Instrucciones para Claude Code
└── README.md
```

**Idioma:** Código y estructura en inglés (carpetas, archivos, variables, funciones, tablas, columnas). Documentación del proyecto y textos visibles al usuario en español.

---

## 14. Decisiones pendientes

- [ ] ORM específico (Prisma vs Drizzle vs otro).
- [ ] Librería de componentes UI (shadcn/ui vs Ant Design vs otra).
- [ ] Editor de texto enriquecido (TipTap vs Plate vs otro).
- [ ] Servicio de hosting (Railway vs Vercel vs Fly.io vs otro).
- [ ] Servicio de almacenamiento de archivos (S3 vs MinIO vs Cloudflare R2).
- [ ] Herramienta de generación de PDF.
- [ ] Frecuencia de scraping de portales judiciales.
- [ ] Manejo de JWT vs sesiones server-side.
- [ ] Sistema de migraciones de base de datos.

---

*Documento generado el 28 de marzo de 2026. Revisado y actualizado el 16 de abril de 2026.*
