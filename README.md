# Prueba técnica - API Testing (ReqRes) con Playwright + TypeScript

Suite de pruebas automatizadas para ReqRes usando Playwright Test y TypeScript. Enfocada en clean code, reutilización y validaciones estables (anti-flaky) sobre una API pública.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Setup

1) Instalar dependencias:

- npm install
- npx playwright install

2) Variables de entorno

- Copia .env.example a .env
- En .env define:
  - BASE_URL=https://reqres.in
  - X_API_KEY=<TU_API_KEY>

Nota: NO subir .env al repo. .env.example solo placeholders.

## Ejecutar

- Suite completa:
  - npm test

- Typecheck:
  - npm run typecheck

## Reporte HTML (obligatorio para la entrega)

- Generar:
  - npm run test:html

- Abrir:
  - npm run report

El reporte queda en:
- playwright-report/

Entrega (ZIP):
- código fuente + playwright-report/
- sin node_modules
- sin .env

## Alcance vs Assignment

1) POST /api/login
- Login OK: 200 + token
- Login KO: credenciales inválidas (email+password presentes) -> 4xx + error
- Login KO: missing fields (email missing, password missing, ambos missing) -> 4xx + error
- Validaciones extra: status + contrato básico (token o error)

2) GET /api/users/2
- 200 + estructura (data, support)
- Validación de contenido (id/email/nombres/avatar)

3) POST /api/users (create)
- Caso válido: 201 + id + createdAt + eco name/job
- Inputs inválidos:
  - No permitir 5xx
  - Validación por rama: si 201 validar id/createdAt; si 4xx validar error/message

4) Paginación /api/users?page=2
- data.length consistente con per_page
- coherencia mínima: page, per_page, total, total_pages
- page 1 vs page 2: usuarios únicos (no solape)

5) Delay /api/users?delay=<n>
- Anti-flaky: validar URL contiene delay, status 200, schema consistente
- No assert estricto de tiempo (puede variar por cache/CDN)

6) Bonus 1 (chained)
- list -> pick user -> detail
- validación de consistencia entre item y detalle

## Bonus 2 (teoría: token auth)

Si el token de /api/login fuese requerido para autenticar el resto de endpoints:

- Store & reuse tokens securely
  - credenciales en .env local o secretos del CI (nunca hardcode)
  - obtener token una vez por worker/suite y cachearlo en memoria
  - no persistir tokens en el repo

- Add auth headers automatically
  - crear un fixture authApi que haga login en setup y adjunte:
    Authorization: Bearer <token>
  - alternativa: BaseClient que adjunte headers comunes a todas las llamadas

- Handle token expiration / reuse
  - si responde 401/403: refrescar token y reintentar 1 vez (sin loops)
  - si hay refresh token: TokenProvider con TTL y refresh antes de expirar
  - en CI: no reusar tokens entre ejecuciones/pipelines
