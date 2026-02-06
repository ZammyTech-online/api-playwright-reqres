# Prueba técnica – API Testing (ReqRes) con Playwright + TypeScript

Este repo contiene una implementación lista para ejecutar de pruebas de API contra `https://reqres.in` usando **Playwright Test**.

## Requisitos
- Node.js 18+ (recomendado 20+)

## Instalación
```bash
npm install
npx playwright install
```

## Configuración
1. Copia `.env.example` a `.env`
2. Rellena `X_API_KEY` con tu API key de ReqRes.

> Nota: el header `x-api-key` es obligatorio según la prueba técnica.

## Ejecutar tests
```bash
npm test
```

## Reporte HTML
```bash
npm run test:html
# luego
npm run report
```
El reporte se genera en `playwright-report/`.

## Estructura
- `src/clients`: clientes por dominio (auth/users)
- `src/fixtures`: fixtures reutilizables (API context)
- `tests`: tests por feature

