# APP JURÍDICA — Especificación del Producto

**Versión:** 1.0
**Fecha:** 28 de marzo de 2026
**Autor:** José (fundador)
**Estado:** Definición inicial — nombre del producto pendiente

---

## 1. Visión del producto

App Jurídica es una plataforma web (SaaS) de gestión jurídica integral para abogados argentinos. Combina las funcionalidades operativas de un sistema de gestión de expedientes tradicional (inspirado en Lex Doctor) con inteligencia artificial integrada y consulta automática de portales judiciales.

El objetivo es que el producto sea útil para el fundador en su ejercicio profesional y, una vez validado, monetizarlo como servicio para otros abogados y estudios.

---

## 2. Público objetivo

- **Abogados independientes** que ejercen solos y necesitan organizar su práctica.
- **Estudios jurídicos pequeños** (2 a 5 abogados) que comparten expedientes y agenda.
- **Asesorías legales de empresas** que gestionan causas internas o tercerizadas.

**NO está dirigido (al menos inicialmente) a:**
- Estudios grandes (6+ abogados) con requerimientos de infraestructura complejos.
- Organismos del poder judicial (juzgados, tribunales, fiscalías).

---

## 3. Alcance geográfico

- **Inicio:** Buenos Aires (Departamento Judicial Bahía Blanca) y Tucumán.
- **Diseño:** La arquitectura debe permitir agregar jurisdicciones provinciales sin rediseño. Cada provincia tiene sus propios portales judiciales, fueros y convenciones.
- **Expansión futura:** Otras provincias argentinas según demanda.

---

## 4. Plataforma y acceso

- **Solo web (navegador).** No hay app móvil nativa ni app de escritorio.
- **Responsive:** Debe funcionar bien en celulares y tablets desde el navegador.
- **Sin instalación:** El usuario accede desde cualquier navegador con email y contraseña.
- **Sin portal de clientes:** Los clientes del estudio (no abogados) NO acceden al sistema.

---

## 5. Modelo de negocio

- **Freemium:**
  - Plan gratuito con funcionalidades limitadas (cantidad de expedientes, sin IA, sin consulta de portales).
  - Plan/es pagos con funcionalidades completas, IA, consulta automática de portales, mayor almacenamiento.
- **Detalles de planes y precios:** Pendiente de definición.
- **Los créditos de IA (llamadas a la API de Claude) se incluyen en el plan pago** y representan un costo variable que debe contemplarse en el pricing.

---

## 6. Aislamiento de datos

- **Multi-tenant con aislamiento total:** Cada estudio/abogado tiene sus datos completamente separados de los demás. Un usuario nunca puede ver datos de otro estudio.
- **Dentro de un estudio**, los usuarios autorizados comparten los datos (expedientes, personas, agenda).

---

## 7. Funcionalidades — Fase 1 (MVP)

Estas son las funcionalidades esenciales para el lanzamiento. El producto NO sale sin todas estas:

### 7.1 Gestión de clientes

Concepto general que agrupa todo el trabajo que el abogado realiza para sus clientes. Se divide en dos secciones independientes dentro de la app, cada una con su propia navegación, listados y lógica:

#### 7.1.1 Expedientes

Para todo asunto que tiene o tuvo una actuación formal, sea judicial o extrajudicial.

**Incluye:**
- Causas judiciales radicadas en cualquier fuero e instancia.
- Mediaciones.
- Arbitrajes.
- Trámites administrativos ante organismos públicos.
- Cualquier asunto que tenga un número de expediente o trámite asignado por un organismo.

**Campos:**
- Número de expediente.
- Carátula (formato "ACTOR c/ DEMANDADO s/ OBJETO").
- Fuero y jurisdicción.
- Juzgado y secretaría.
- Tipo de proceso.
- Estado (configurable).
- Cliente principal.
- Abogado responsable.
- Fecha de inicio.
- Monto reclamado.
- Moneda.
- Observaciones.
- Campos auxiliares configurables por tipo de proceso.
- Vinculación con portal judicial (MEV, SAE, etc.) para consulta automática.

**Todos los fueros desde el inicio** (Civil, Comercial, Laboral, Penal, Familia, Contencioso Administrativo, Cobros y Apremios, Sucesiones, etc.).

**Operaciones:**
- Alta, consulta, modificación y baja.
- Búsqueda por múltiples criterios (carátula, número, fuero, estado, abogado, cliente, fechas).
- Vinculación entre expedientes relacionados (conexos, acumulados, incidentes).

#### 7.1.2 Otros casos (nombre provisorio — pendiente de definición)

Para todo trabajo jurídico que NO tiene actuación formal ante ningún organismo. No tiene número de expediente, no tiene juzgado, no está en ningún portal judicial.

**Ejemplos:**
- Redacción y negociación de contratos (arrendamiento, compraventa, sociedad, etc.).
- Asesoramiento preventivo a clientes.
- Consultas jurídicas.
- Negociaciones extrajudiciales con contrapartes.
- Tratativas pre-mediación o pre-judiciales.
- Due diligence.
- Dictámenes e informes legales.
- Cualquier trabajo que el abogado quiera registrar y organizar pero que no constituye un expediente.

**Campos:**
- Título (libre, ej: "Contrato de arrendamiento — Campo Los Álamos").
- Cliente principal.
- Contraparte (si corresponde).
- Tipo de asunto (configurable: consulta, contrato, negociación, asesoramiento, dictamen, otro).
- Estado (configurable).
- Abogado responsable.
- Fecha de inicio.
- Monto / honorarios estimados (si corresponde).
- Moneda.
- Observaciones.

**Operaciones:**
- Alta, consulta, modificación y baja.
- Búsqueda por múltiples criterios (título, cliente, tipo, estado, abogado, fechas).

**Nota:** Un "otro caso" puede convertirse en expediente si eventualmente se judicializa. La app debe permitir esa conversión manteniendo el historial de actividad, documentos y notas previas.

#### Elementos compartidos entre Expedientes y Otros Casos

Ambas secciones comparten los mismos sub-módulos:
- Personas vinculadas (con roles).
- Agenda y vencimientos.
- Registro de movimientos / actividad.
- Documentos adjuntos.
- Acceso al asistente de IA contextual.

La diferencia es que los Expedientes tienen además: gestiones de procuración, consulta automática de portales judiciales, y campos específicos del proceso judicial (cuaderno, foja, juzgado, fuero).

### 7.2 Directorio de personas y contactos
- Registro centralizado de personas físicas y jurídicas.
- Roles: cliente, contraparte, abogado, procurador, perito, testigo, juez, secretario.
- Datos: nombre, apellido, CUIT/CUIL, domicilios (real, legal, constituido), teléfonos, email.
- Vinculación persona-expediente o persona-caso con rol específico.
- Búsqueda por nombre, CUIT, rol.

### 7.3 Agenda y vencimientos
- Eventos vinculados a expedientes, otros casos, o independientes.
- Tipos de evento: audiencia, vencimiento, reunión, recorrida, mediación, otros.
- Asignación de eventos a usuarios específicos del estudio.
- Notificaciones y avisos (al menos por email; notificaciones push como mejora futura).
- Vistas: día, semana, mes.
- Auto-agendamiento cuando se registran pruebas con fecha de audiencia.

### 7.4 Registro de movimientos y actuaciones
- Registro cronológico de toda la actividad de cada expediente o caso.
- En casos judiciales: actuaciones procesales con cuaderno y foja.
- En consultas/asesoramientos: registro de actividad libre (reuniones, llamadas, emails, avances, notas).
- Campos: fecha, tipo de movimiento, descripción, usuario que registró.
- Posibilidad de adjuntar documentos (PDF, imágenes, Word) a cada movimiento.
- Filtros por tipo, fecha, estado.

### 7.5 Gestiones de procuración
- Registro de diligencias: cédulas, mandamientos, oficios, exhortos.
- Campos: tipo de gestión, estado, responsable, fecha de vencimiento, notas.
- Vinculación con agenda para seguimiento de vencimientos.
- Listas de control para procuradores.

### 7.6 Editor y generador de escritos
- Editor de texto enriquecido integrado (negrita, cursiva, tablas, encabezados).
- Sistema de modelos/plantillas de documentos legales (demandas, contestaciones, cédulas, oficios, recursos, etc.).
- Variables automáticas que extraen datos del expediente activo (número, carátula, partes, juzgado, fechas, montos, etc.).
- Clasificación de modelos por rubro/fuero.
- Generación de PDF desde el editor.
- Almacenamiento de documentos generados vinculados al expediente.

### 7.7 Gestión documental
- Subida y almacenamiento de archivos de cualquier tipo vinculados a cada expediente o caso.
- Organización por categorías (escritos, resoluciones, documentación, pericias, etc.).
- Visor de PDF integrado.
- Descarga individual y masiva.

### 7.8 Reportes y estadísticas
- Listados de expedientes con filtros combinables.
- Reportes predefinidos: expedientes por estado, por fuero, por abogado, próximos a vencer.
- Exportación a Excel/CSV.
- Dashboard con KPIs básicos: total de expedientes activos, vencimientos próximos, montos en cartera.
- Estadísticas visuales (gráficos de distribución por fuero, por estado, por abogado).

### 7.9 Consulta automática de portales judiciales
- **Desde el día 1.** Es un diferencial central del producto.
- Conexión con la MEV (Mesa de Entradas Virtual) de la Provincia de Buenos Aires.
- Conexión con el Portal del SAE del Poder Judicial de Tucumán.
- Consulta periódica automática del estado de los expedientes cargados.
- Actualización automática de movimientos/actuaciones detectados en los portales.
- Notificación al usuario cuando hay novedades en sus expedientes.
- **Nota técnica:** La viabilidad depende del resultado de la investigación de las APIs/endpoints de cada portal. Puede requerir scraping web.

### 7.10 Asistente de IA
- Chat contextual integrado con acceso a los datos del expediente o caso activo.
- Redacción asistida de escritos judiciales a partir de datos del expediente y modelos.
- Análisis de documentos subidos (contratos, resoluciones, pericias).
- Búsqueda inteligente de jurisprudencia (semántica, no solo por palabras clave).
- Sugerencias de próximos pasos procesales basadas en el estado del expediente.
- Alertas predictivas de caducidad y prescripción.
- **Implementación:** Vía API de Anthropic (Claude). El modelo recibe contexto del expediente y herramientas (tools) para consultar la base de datos.

---

## 8. Funcionalidades — Fase 2 (post-lanzamiento)

Estas funcionalidades NO son necesarias para el lanzamiento pero se agregarán después:

- **Contabilidad por expediente:** Rubros contables (capital, intereses, honorarios, gastos). Pendiente.
- **Facturación electrónica (AFIP):** Emisión de facturas A/B/C con CAE. Pendiente.
- **Liquidaciones judiciales:** Actualización monetaria con tasas de interés, conversión de monedas. Pendiente.
- **Caja:** Registro de ingresos y egresos. Pendiente.
- **Base jurídica propia:** Biblioteca de legislación y jurisprudencia con árbol temático. Pendiente.
- **Operaciones masivas (impulso):** Acciones en lote sobre múltiples expedientes. Pendiente.
- **Portal de clientes:** Que los clientes del estudio consulten sus expedientes online. Descartado por ahora.
- **App móvil nativa:** Descartada por ahora. Se prioriza responsive web.
- **Integración con Bus Federal de Justicia:** Para comunicaciones interjurisdiccionales. Pendiente.
- **Firma digital de documentos.** Pendiente.
- **Correo electrónico integrado.** Pendiente.

---

## 9. Fueros soportados

El sistema debe soportar todos los fueros desde el inicio. La diferencia entre fueros se refleja en:
- Tipos de proceso disponibles.
- Modelos de escritos específicos.
- Plazos procesales configurables.
- Campos auxiliares por tipo de expediente.

Fueros contemplados:
- Civil y Comercial
- Laboral
- Penal
- Familia
- Contencioso Administrativo
- Cobros y Apremios
- Sucesiones
- Extrajudicial (mediaciones, trámites administrativos)

---

## 10. Usuarios y permisos

- **Primer usuario:** El fundador (José), abogado en Bahía Blanca y Tucumán.
- **Sistema de roles:** Al menos dos niveles: administrador del estudio y usuario estándar.
- **Definición detallada de roles y permisos:** Pendiente. Se espera algo más simple que los 6 niveles de Lex Doctor para el MVP.

---

## 11. Stack tecnológico (decisiones tomadas)

- **Tipo de aplicación:** Webapp SaaS, solo web.
- **Frontend:** React con TypeScript.
- **Backend:** Node.js.
- **Base de datos:** PostgreSQL.
- **IA:** API de Anthropic (Claude) como proveedor inicial.
- **Hosting:** Nube (servicio específico pendiente de definición).
- **Repositorio:** GitHub.
- **Herramienta de desarrollo:** Claude Code (terminal, desktop o web).

### 11.1 Capa de abstracción del LLM (decisión de arquitectura)

El backend debe implementar un módulo intermedio (servicio de IA) que encapsule todas las llamadas al LLM. El resto de la aplicación nunca llama directamente a la API de Anthropic — siempre pasa por este módulo.

**Propósito:** Permitir cambiar de proveedor de IA (de Claude a GPT, Gemini, u otro) modificando solo este módulo, sin tocar el resto de la aplicación.

**El módulo expone funciones de negocio**, no funciones técnicas del LLM. Ejemplos: `generarEscrito()`, `analizarDocumento()`, `buscarJurisprudencia()`, `sugerirProximosPasos()`. Por dentro, cada función arma el prompt, define las herramientas, llama al LLM y procesa la respuesta.

**Proveedor inicial:** Claude (API de Anthropic). Elegido por su calidad en razonamiento legal, escritura en español, y sistema de herramientas (tools). Esta elección puede revisarse en el futuro sin impacto en la aplicación.

---

## 12. Competencia

### Lex Doctor
- Líder del mercado argentino desde hace 36+ años.
- Aplicación de escritorio (Windows), interfaz anticuada.
- Base de datos Firebird, protocolo propietario.
- Sin IA, sin acceso web real, app móvil limitada.
- Licencias perpetuas costosas.
- Muy completo funcionalmente (220+ campos por expediente, 50+ condiciones de búsqueda).

### Otras alternativas
- **LitigarOnline:** SaaS web, funcionalidades básicas, sin IA.
- **Harvey (internacional):** IA legal construida sobre Claude, enfocada en mercado anglosajón. No compite directamente en gestión de expedientes argentinos.
- **Paralegal.ar:** Monitoreo de MEV con IA, alcance limitado a Buenos Aires.

### Diferencial de App Jurídica
- Webapp moderna accesible desde cualquier navegador.
- IA integrada para redacción, análisis y asistencia.
- Consulta automática de portales judiciales multi-jurisdicción.
- Modelo freemium accesible vs. licencias caras de Lex Doctor.
- Diseñado por un abogado para abogados.

---

## 13. Portales judiciales — Estado de investigación

### Provincia de Buenos Aires
- **MEV (mev.scba.gov.ar):** Consulta de expedientes con usuario y contraseña. Tiene app móvil, lo que sugiere API interna. Bahía Blanca es departamento judicial disponible.
- **PyNE (notificaciones.scba.gov.ar):** Presentaciones y notificaciones electrónicas. Requiere certificado de firma digital. Integración más compleja.
- **Bus Federal:** Buenos Aires está operativa. API REST documentada con sandbox en GitHub (github.com/ifitej/busfederal).

### Tucumán
- **Portal del SAE (portaldelsae.justucuman.gov.ar):** Presentaciones digitales, consultas, turnos. Autenticación con CUIT y contraseña.
- **Consulta de Expedientes (consultaexpedientes.justucuman.gov.ar):** App JavaScript moderna (SPA), lo que confirma API interna consumible.

### Acciones pendientes
- Inspeccionar tráfico de red (F12) en MEV y Portal del SAE para documentar endpoints.
- Contactar a Subsecretaría de Tecnología Informática de SCBA (0810-444-7222).
- Contactar a Dirección de Sistemas del Poder Judicial de Tucumán.
- Unirse al grupo de Telegram del Bus Federal (t.me/busfederal_tech).
- Solicitar acceso al sandbox de la API REST del Bus Federal.

---

## 14. Quién desarrolla y opera

- **Desarrollo:** José con Claude Code. Posibilidad de contratar un desarrollador más adelante.
- **Operación:** José inicialmente, con posibilidad de delegar.
- **Primer usuario:** José, ejerciendo en Bahía Blanca (Buenos Aires) y Tucumán.

---

## 15. Decisiones pendientes

- [ ] Nombre del producto (actualmente "App Jurídica" como placeholder).
- [ ] Detalle de planes freemium (qué incluye gratis, qué es pago, precios).
- [ ] Detalle de roles y permisos de usuario.
- [ ] Servicio de hosting en la nube.
- [ ] Diseño detallado de la UI (el prototipo existente sirve como referencia inicial).
- [ ] Priorización dentro de la Fase 1 (qué se construye primero dentro del MVP).
- [ ] Resultado de la investigación de APIs de portales judiciales.

---

*Documento generado el 28 de marzo de 2026. Fuentes: análisis de Lex Doctor (ANALISIS_LEXDOCTOR_CLIENTE2025.md), investigación de portales judiciales, y definiciones del fundador.*
