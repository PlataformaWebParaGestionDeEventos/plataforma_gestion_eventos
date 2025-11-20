/**
 * Configuración de Jest para el proyecto de gestión de eventos
 * @fileoverview Configuración completa de Jest con soporte para React, Firebase mocking y ES modules
 */

export default {
  // Entorno de testing
  testEnvironment: "jsdom",

  // Soporte para ES modules
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".jsx"],

  // Directorio raíz del proyecto
  rootDir: "../",

  // Directorios donde buscar tests
  testMatch: [
    "<rootDir>/Tests/**/*.test.{js,jsx}",
    "<rootDir>/Tests/**/*.spec.{js,jsx}",
  ],

  // Archivos de configuración a ejecutar antes de los tests
  setupFilesAfterEnv: ["<rootDir>/Tests/setupTests.js"],

  // Mapeo de módulos para resolver imports
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@hooks/(.*)$": "<rootDir>/src/core/hooks/$1",
    "^@utils/(.*)$": "<rootDir>/src/core/utils/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
  },

  // Transformaciones
  transform: {
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { modules: false }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    ],
  },

  // Archivos a ignorar para transformación
  transformIgnorePatterns: [
    "node_modules/(?!(firebase|@firebase|html5-qrcode|qrcode.react)/)",
  ],

  // Mocks manuales
  moduleFileExtensions: ["js", "jsx", "json"],

  // Configuración de cobertura
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/**/*.stories.{js,jsx}",
    "!src/**/__tests__/**",
    "!src/**/node_modules/**",
  ],

  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "<rootDir>/Tests/coverage",

  // Umbrales mínimos de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Limpiar mocks automáticamente
  clearMocks: true,
  restoreMocks: true,

  // Timeout para tests asincrónicos
  testTimeout: 10000,

  // Variables de entorno para testing
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
};
