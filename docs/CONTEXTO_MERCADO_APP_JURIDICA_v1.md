# APP JURÍDICA — Contexto de Mercado

**Versión:** 1.0
**Fecha:** 28 de marzo de 2026
**Estado:** Definición inicial

---

## 1. El fundador

- **Nombre:** José.
- **Profesión:** Abogado.
- **Jurisdicciones donde ejerce:** Bahía Blanca (Provincia de Buenos Aires) y Tucumán.
- **Modalidad de ejercicio:** Solo, sin empleados ni socios.
- **Herramientas actuales:** Excel, Word y carpetas. No usa ningún sistema de gestión jurídica actualmente.
- **Experiencia con Lex Doctor:** Lo usó pero lo dejó.
- **Perfil técnico:** No programador. Usa Claude Code para desarrollo de software, con experiencia previa en un proyecto de gestión comercial para pymes.

---

## 2. El mercado argentino de gestión jurídica

### Tamaño
- Más de 130.000 abogados matriculados activos en Argentina.
- Miles de estudios jurídicos de todos los tamaños.
- Asesorías legales de bancos, empresas, municipalidades, organismos estatales.
- El mercado se extiende a toda América Latina (Lex Doctor tiene presencia en más de 1.500 ciudades de la región).

### Estado actual
- Lex Doctor domina el mercado desde hace 36+ años, prácticamente sin competencia seria.
- La mayoría de los abogados que NO usan Lex Doctor gestionan con Excel, Word y carpetas — como el fundador.
- Las alternativas modernas (SaaS) son pocas, incompletas o con poco alcance.
- La pandemia aceleró la digitalización judicial (expediente digital, presentaciones electrónicas, notificaciones electrónicas), pero las herramientas de gestión de los abogados no evolucionaron al mismo ritmo.
- La IA aplicada al derecho argentino es prácticamente inexistente en productos locales.

### Dolor del mercado
- Lex Doctor es potente pero anticuado: interfaz tipo Windows 98, sin acceso web, sin movilidad real, caro.
- Los abogados que no usan Lex Doctor no tienen una alternativa accesible que cubra todo lo que necesitan.
- Consultar el estado de expedientes requiere entrar manualmente a los portales judiciales de cada jurisdicción, uno por uno, expediente por expediente.
- No existe una herramienta que unifique la gestión interna del estudio con la consulta automatizada de portales judiciales y asistencia de IA.

---

## 3. Competencia directa

### Lex Doctor (CADDEL S.A.)
- **Qué es:** Software de gestión jurídica de escritorio para Windows.
- **Antigüedad:** 36+ años (desde 1989).
- **Motor de datos:** Firebird (embebido o servidor).
- **Arquitectura:** Aplicación de escritorio cliente-servidor con protocolo propietario (puerto 211).
- **Fortalezas:**
  - Funcionalidad muy completa: 220+ campos por expediente, 50+ condiciones de búsqueda.
  - Procesador de textos integrado con variables automáticas.
  - Generador de reportes potente.
  - Liquidaciones judiciales con tasas de interés.
  - Facturación electrónica AFIP.
  - Base de legislación y jurisprudencia (LD-Textos).
  - Masivamente adoptado — efecto red.
- **Debilidades:**
  - Interfaz anticuada, estética tipo DOS/Windows 98.
  - Solo Windows, sin versión para Mac ni Linux.
  - Sin acceso web real. El acceso remoto requiere configurar puertos y VPN.
  - App móvil (LEXMovil) muy limitada.
  - Sin inteligencia artificial.
  - Sin integración automática con portales judiciales (solo links manuales).
  - Licencias perpetuas costosas. Modelo de negocio anacrónico.
  - Sin colaboración en tiempo real.
- **Modelo de negocio:** Licencias perpetuas (pago único alto) + licencias anuales opcionales para acceso remoto/nube.

### LitigarOnline
- **Qué es:** Sistema de gestión jurídica online (SaaS).
- **Fortalezas:** Accesible desde el navegador, modelo de suscripción.
- **Debilidades:** Funcionalidades más limitadas que Lex Doctor. Sin IA. Interfaz básica.

### Paralegal.ar
- **Qué es:** Servicio de monitoreo de la MEV de Buenos Aires con resúmenes por IA.
- **Fortalezas:** Resuelve un dolor específico (monitoreo de expedientes en Buenos Aires).
- **Debilidades:** Alcance limitado a Buenos Aires. No es un sistema de gestión completo. Solo monitorea, no gestiona.

### Harvey (internacional)
- **Qué es:** Plataforma de IA legal construida sobre Claude, enfocada en el mercado anglosajón.
- **Relación:** Socio del Anthropic Marketplace. No compite directamente en el mercado argentino ni ofrece gestión de expedientes según el derecho argentino.
- **Relevancia:** Valida el modelo de IA legal como negocio. Demuestra que hay mercado.

---

## 4. Diferencial de App Jurídica

| Aspecto | Lex Doctor | LitigarOnline | App Jurídica |
|---------|-----------|---------------|-------------|
| Acceso | Solo Windows | Web | Web (cualquier dispositivo) |
| IA integrada | No | No | Sí (Claude) |
| Consulta automática de portales | No (links manuales) | No | Sí (MEV, SAE, etc.) |
| Interfaz | Anticuada | Básica | Moderna, dark/light mode |
| Precio | Licencia cara | Suscripción | Freemium |
| Multi-jurisdicción | Configurable | Limitado | Diseñado desde el inicio |
| Gestión de casos no judiciales | Limitado | No | Sí ("Otros casos") |
| Movilidad | App limitada | Responsive | Responsive |
| Personalización visual | No | No | Logo + colores por estudio |

---

## 5. Portales judiciales — Jurisdicciones del fundador

### Provincia de Buenos Aires (Bahía Blanca)

**Sistema de gestión judicial:** Augusta (interno de juzgados, desarrollado por la SCBA).

**Portales para abogados:**

| Portal | URL | Función | Autenticación |
|--------|-----|---------|---------------|
| MEV | mev.scba.gov.ar | Consulta de expedientes en todos los fueros | Usuario + contraseña |
| PyNE | notificaciones.scba.gov.ar | Presentaciones y notificaciones electrónicas | Certificado digital (token USB) |
| MEV App | App móvil (Android, iOS, WinPhone) | Consulta móvil con sets de búsqueda | Mismas credenciales que MEV web |

- Bahía Blanca es departamento judicial disponible en la MEV.
- La MEV tiene app móvil, lo que sugiere API interna consumible.
- PyNE requiere certificado de firma digital — integración más compleja.
- Buenos Aires está operativa en el Bus Federal de Justicia.
- La SCBA tiene wiki técnica: wiki.scba.gov.ar.
- Centro de atención: 0810-444-7222.

### Tucumán

**Sistema de gestión judicial:** SAE, sobre plataforma "Alberdi" (desarrollado por la Dirección de Sistemas del PJ de Tucumán).

| Portal | URL | Función | Autenticación |
|--------|-----|---------|---------------|
| Portal del SAE | portaldelsae.justucuman.gov.ar | Presentaciones, consultas, turnos | CUIT + contraseña |
| Consulta Expedientes | consultaexpedientes.justucuman.gov.ar | Consulta pública de expedientes | Por definir |

- El portal de consulta de expedientes es una SPA (JavaScript), confirmando API interna.
- Desde 2022 se pueden iniciar demandas digitalmente por el Portal del SAE.
- Expedientes de Familia se consultan por portal separado (login.justucuman.gov.ar).
- Tutoriales disponibles en www4.justucuman.gov.ar/tutoriales-normativas/.

### Bus Federal de Justicia

- **Qué es:** Plataforma de interoperabilidad entre poderes judiciales argentinos.
- **Creado por:** IFITEJ (Instituto Federal de Innovación, Tecnología y Justicia) de JUFEJUS.
- **Estado:** Operativo en 20+ provincias incluyendo Buenos Aires y Tucumán.
- **Integración:** API REST documentada. Sandbox disponible para desarrollo.
- **Repositorio:** github.com/ifitej/busfederal (librerías en C#, acceso directo a API REST).
- **Comunidad técnica:** Grupo de Telegram (t.me/busfederal_tech).
- **Uso para App Jurídica:** Fase 2, para comunicaciones interjurisdiccionales.

### Acciones pendientes de investigación

1. Inspeccionar tráfico de red (F12) en MEV (mev.scba.gov.ar) mientras se consulta un expediente.
2. Inspeccionar tráfico de red (F12) en consultaexpedientes.justucuman.gov.ar.
3. Contactar Subsecretaría de Tecnología Informática de la SCBA (0810-444-7222) para preguntar sobre APIs.
4. Contactar Dirección de Sistemas del PJ de Tucumán para preguntar sobre APIs.
5. Unirse al grupo de Telegram del Bus Federal (t.me/busfederal_tech).
6. Solicitar acceso al sandbox de la API REST del Bus Federal.

---

## 6. Oportunidad de mercado

### Por qué ahora
- La digitalización judicial avanzó enormemente post-pandemia, pero las herramientas de los abogados quedaron atrás.
- Lex Doctor no se modernizó. Su interfaz y arquitectura son de otra época.
- La IA generativa alcanzó un nivel de calidad que la hace útil para trabajo jurídico real (redacción de escritos, análisis de documentos, búsqueda de jurisprudencia).
- No existe ningún producto argentino que combine gestión jurídica + IA + consulta automática de portales.

### Segmento más accesible
- Abogados independientes y estudios chicos que hoy gestionan con Excel y Word.
- No usan Lex Doctor porque es caro y complejo.
- Un producto freemium con interfaz moderna y IA les resuelve un dolor real.
- Son el segmento más grande en cantidad.

### Riesgo principal
- Inercia del mercado: los abogados son conservadores con herramientas de trabajo.
- Competencia futura: si Lex Doctor se moderniza o si aparece un competidor con más recursos.
- Dependencia de los portales judiciales: si cambian sus sistemas, el scraper se rompe.
- Migración de datos: los que ya usan Lex Doctor necesitan poder traer sus datos.

---

*Documento generado el 28 de marzo de 2026. Fuentes: análisis de Lex Doctor, investigación de portales judiciales, investigación de competencia, y definiciones del fundador.*
