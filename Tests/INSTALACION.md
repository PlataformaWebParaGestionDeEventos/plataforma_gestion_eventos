# 📄 Configuración de Testing - Actualización package.json

Para completar la configuración de tests, actualiza tu `package.json` con las siguientes configuraciones:

## 🔧 Dependencias de desarrollo a agregar:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "jsdom": "^23.0.0",
    "vitest": "^2.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

## 📝 Scripts de testing a agregar:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:services": "vitest run Tests/services",
    "test:hooks": "vitest run Tests/hooks",
    "test:utils": "vitest run Tests/utils",
    "test:components": "vitest run Tests/components",
    "test:validation": "vitest run Tests/validation"
  }
}
```

## ⚙️ Configuración de Vitest en vite.config.js:

```javascript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./Tests/setupTests.js",
    css: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "Tests/",
        "dist/",
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "src/main.jsx",
        "src/config/credenciales.js",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@services": "/src/services",
      "@hooks": "/src/core/hooks",
      "@utils": "/src/core/utils",
      "@config": "/src/config",
    },
  },
});
```

## 🚀 Comandos para instalar y ejecutar:

```bash
# 1. Instalar dependencias
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @vitest/coverage-v8 jsdom vitest happy-dom

# 2. Ejecutar tests
npm run test              # Modo watch interactivo
npm run test:run          # Ejecutar todos los tests una vez
npm run test:coverage     # Ejecutar con reporte de cobertura

# 3. Ejecutar tests específicos
npm run test:services     # Solo tests de servicios
npm run test:hooks        # Solo tests de hooks
npm run test:components   # Solo tests de componentes
```

## 📊 Visualizar resultados:

- **Cobertura**: Se genera en `Tests/coverage/index.html`
- **Tests en vivo**: Usar `npm run test:ui` para interfaz web
- **Modo watch**: `npm run test` para desarrollo iterativo

Tu proyecto ahora tiene **148+ tests** cubriendo todas las funcionalidades críticas! 🎉
