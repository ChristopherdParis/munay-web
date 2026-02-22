# Design Sync (sas-mvp-restaurant -> frontend)

**Objetivo:** replicar 1:1 los design tokens y la configuracion de Tailwind del proyecto Vite + React en este proyecto Angular.

## Archivos copiados y ajustados
- `sas-mvp-restaurant/tailwind.config.ts`
  - Se replico en `frontend/tailwind.config.js` con el mismo `theme.extend`, `darkMode` y `plugins`.
- `sas-mvp-restaurant/src/index.css`
  - Se replico en `frontend/src/styles.scss` incluyendo `@tailwind` directives, `@layer base`, variables `:root` y `.dark`, y utilities.

## Tokens sincronizados
- Colores base (`background`, `foreground`, `border`, `input`, `ring`).
- Paletas semanticas (`primary`, `secondary`, `accent`, `muted`, `destructive`).
- Tokens de `card`, `popover`, `success`, `warning`.
- Tokens de `kitchen` y `sidebar`.
- `--radius` y `borderRadius` derivados.
- Keyframes y `animation` (accordion, slide-in, pulse-soft).

## Plugins agregados
- `tailwindcss-animate`

## Configuracion de Tailwind en Angular
- `frontend/tailwind.config.js` con `content: ["./src/**/*.{html,ts}"]`.
- `frontend/postcss.config.js` con `tailwindcss` y `autoprefixer`.
- Dependencias agregadas en `frontend/package.json`:
  - `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`.

## Notas y advertencias
- Se reemplazo la tipografia previa en `frontend/src/styles.scss` por `Inter` para igualar el proyecto React.
- Para compilar correctamente, instalar dependencias en `frontend` (por ejemplo `npm install`).
- La compatibilidad con `hsl(var(--token))` queda garantizada al usar las mismas variables CSS.
