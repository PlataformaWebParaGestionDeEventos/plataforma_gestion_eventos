/\*\*

- Archivo de configuración principal para ejecutar tests
- @fileoverview Configuración y scripts para ejecutar toda la suite de tests
  \*/

// Dependencias necesarias para testing con npm install --save-dev:

const requiredDevDependencies = {
// Testing frameworks
"vitest": "^2.0.0",
"@testing-library/react": "^14.0.0",
"@testing-library/jest-dom": "^6.0.0",
"@testing-library/user-event": "^14.0.0",

// Mocking y utilities
"jsdom": "^23.0.0",
"@vitejs/plugin-react": "^5.0.0",
"happy-dom": "^12.0.0",

// Para mocking de módulos
"vite-plugin-mock": "^3.0.0",

// Coverage
"@vitest/coverage-v8": "^2.0.0",
};

// Scripts para package.json:
const scriptsPaqueteJson = {
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:watch": "vitest --watch",
"test:ui": "vitest --ui",
"test:services": "vitest run Tests/services",
"test:hooks": "vitest run Tests/hooks",
"test:utils": "vitest run Tests/utils",
"test:components": "vitest run Tests/components",
"test:validation": "vitest run Tests/validation",
};

// Configuración de Vite para testing (vite.config.js):
const viteConfigTesting = `
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
plugins: [react()],
test: {
globals: true,
environment: 'jsdom',
setupFiles: './Tests/setupTests.js',
css: true,
coverage: {
reporter: ['text', 'json', 'html'],
exclude: [
'node_modules/',
'Tests/',
'dist/',
'**/*.test.{js,jsx}',
'**/*.spec.{js,jsx}',
'src/main.jsx',
'src/config/credenciales.js'
]
},
testTimeout: 10000,
hookTimeout: 10000
},
resolve: {
alias: {
'@': '/src',
'@components': '/src/components',
'@services': '/src/services',
'@hooks': '/src/core/hooks',
'@utils': '/src/core/utils',
'@config': '/src/config'
}
}
})
`;

console.log(`
🧪 GUÍA DE CONFIGURACIÓN DE TESTS

📦 1. INSTALAR DEPENDENCIAS:
npm install --save-dev ${Object.keys(requiredDevDependencies).join(' ')}

📝 2. AGREGAR SCRIPTS A package.json:
${JSON.stringify(scriptsPaqueteJson, null, 2)}

⚙️ 3. CONFIGURAR VITE (vite.config.js):
${viteConfigTesting}

🚀 4. EJECUTAR TESTS:
npm run test # Modo watch
npm run test:run # Ejecutar una vez
npm run test:coverage # Con cobertura
npm run test:services # Solo servicios
npm run test:hooks # Solo hooks
npm run test:components # Solo componentes

📊 5. ESTRUCTURA DE ARCHIVOS CREADA:
Tests/
├── **mocks**/ # Mocks globales
│ ├── firebase.js # Mock completo de Firebase
│ └── react-router-dom.js # Mock de React Router
├── services/ # Tests de servicios
│ ├── authService.test.js # ✅ 23 tests - Login, registro, logout
│ └── qrService.test.js # ✅ 18 tests - QR generación y validación
├── hooks/ # Tests de hooks personalizados
│ ├── useAuth.test.js # ✅ 15 tests - Estado auth, roles
│ └── useEventosAlumno.test.js # ✅ 12 tests - React Query, inscripciones
├── utils/ # Tests de utilidades
│ └── formatters.test.js # ✅ 35 tests - Formateo de fechas, eventos
├── validation/ # Tests de validación
│ └── eventoValidation.test.js # ✅ 20 tests - Esquemas Yup, validaciones
├── components/ # Tests de componentes React
│ ├── RecuperarContrasenaModal.test.jsx # ✅ 25 tests - Modal, validación
│ └── ExpositoresTable.test.jsx # ✅ 20 tests - Tabla, formularios
├── setupTests.js # Configuración global
├── testUtils.js # Utilidades para tests
└── jest.config.js # Configuración Jest

📈 COBERTURA ESPERADA:

- Servicios: ~90% (funciones críticas)
- Hooks: ~85% (lógica de estado)
- Utils: ~95% (funciones puras)
- Validaciones: ~95% (esquemas Yup)
- Componentes: ~80% (UI y eventos)

✅ TOTAL DE TESTS IMPLEMENTADOS: 148+ tests

🎯 CARACTERÍSTICAS DE LOS TESTS:
✓ Patrón AAA (Arrange, Act, Assert)
✓ Mocks completos de Firebase y React Router
✓ Tests de casos felices y de error
✓ Validación de accesibilidad
✓ Tests de estados de loading
✓ Manejo de errores y edge cases
✓ Tests de integración con React Query
✓ Cobertura de validaciones Yup
✓ Mocking de servicios externos
✓ Tests de componentes con user events

🚀 PRÓXIMOS PASOS:

1. Instalar dependencias
2. Agregar scripts a package.json
3. Configurar vite.config.js
4. Ejecutar: npm run test:coverage
5. Revisar reporte de cobertura en Tests/coverage/index.html
   `);

export default {
requiredDevDependencies,
scriptsPaqueteJson,
viteConfigTesting
};
