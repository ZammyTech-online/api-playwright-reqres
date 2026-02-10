# Prueba técnica - API Testing (ReqRes) con Playwright + TypeScript

Suite de pruebas automatizadas para ReqRes usando Playwright Test y TypeScript. Enfocada en clean code, reutilización y validaciones estables (anti-flaky) sobre una API pública.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Setup

1) Instalar dependencias:

- npm install
- npx playwright install

2) Variables de entorno (sin hardcodear secretos)

El PDF indica que **x-api-key es obligatorio** para que las requests funcionen.:contentReference[oaicite:3]{index=3}

- Copia `.env.example` a `.env`
- En `.env` define:
  - BASE_URL=https://reqres.in
  - X_API_KEY=<TU_API_KEY>

Notas importantes:
- `.env` NO se sube al repo (está en `.gitignore`).
- `.env.example` debe tener SOLO placeholders (nunca una key real).

## Ejecutar

- Suite completa:
  - npm test

- Typecheck:
  - npm run typecheck

- Modo CI-safe (menos paralelismo):
  - npm run test:ci

## Reporte HTML (obligatorio para la entrega)

El PDF exige generar reporte HTML y adjuntarlo al ZIP.:contentReference[oaicite:4]{index=4}

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
- Login KO: missing fields -> 4xx + error

2) GET /api/users/2
- 200 + estructura (data, support) + contenido esperado

3) POST /api/users (create)
- Caso válido: 201 + id + createdAt + eco name/job
- Inputs inválidos:
  - No permitir 5xx
  - Rama 201 o 4xx sin inventar comportamiento del proveedor

4) Paginación /api/users?page=2
- “correct number of users”
- page/per_page/total/total_pages accurate
- page1 vs page2: usuarios únicos

5) Delay
- Anti-flaky: validar URL contiene delay + 200 + schema

6) Bonus 1 (chained)
- list -> pick user -> detail consistency

## Bonus 2 (teoría: token auth)

Si el token de /api/login fuese requerido para autenticar el resto de endpoints:
- Store & reuse tokens securely
- Add auth headers automatically
- Handle token expiration / reuse
