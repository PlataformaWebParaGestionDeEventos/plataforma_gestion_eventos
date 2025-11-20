/**
 * Configuración global para todos los tests
 * @fileoverview Setup inicial de Jest con React Testing Library, mocks y utilities
 */

import "@testing-library/jest-dom";
import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup automático después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Configuración global de mocks
beforeEach(() => {
  // Mock de console.error para evitar ruido en tests
  vi.spyOn(console, "error").mockImplementation(() => {});

  // Mock de window.matchMedia (necesario para componentes que usan media queries)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock de IntersectionObserver (para componentes con scroll infinito)
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Mocks globales para React Testing Library
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de URL.createObjectURL para tests de archivos
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Configuraciones personalizadas de expect
expect.extend({
  // Helper para verificar que un elemento tenga clases CSS específicas
  toHaveClasses(received, expected) {
    const classes = Array.isArray(expected) ? expected : [expected];
    const classList = received.classList || [];

    const hasAllClasses = classes.every((className) =>
      Array.from(classList).includes(className)
    );

    return {
      message: () =>
        hasAllClasses
          ? `Expected element NOT to have classes: ${classes.join(", ")}`
          : `Expected element to have classes: ${classes.join(", ")}`,
      pass: hasAllClasses,
    };
  },
});

// Variables de entorno para testing
process.env.NODE_ENV = "test";
process.env.VITE_FIREBASE_API_KEY = "test-api-key";
process.env.VITE_FIREBASE_PROJECT_ID = "test-project-id";

export default {};
