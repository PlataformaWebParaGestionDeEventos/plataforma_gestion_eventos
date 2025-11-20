/**
 * Utilidades comunes para testing
 * @fileoverview Funciones helper para simplificar la escritura de tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

/**
 * Renderiza un componente con React Router para tests
 * @param {React.ReactElement} ui - Componente a renderizar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Resultado del render con utilities adicionales
 */
export const renderWithRouter = (ui, { route = "/", ...options } = {}) => {
  // Configurar historial inicial
  window.history.pushState({}, "Test page", route);

  const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

  const result = render(ui, { wrapper: Wrapper, ...options });

  return {
    ...result,
    // Utilities adicionales
    navigate: (path) => {
      window.history.pushState({}, "Test page", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
  };
};

/**
 * Simula un usuario escribiendo en un campo de input
 * @param {string} labelOrPlaceholder - Label o placeholder del input
 * @param {string} value - Valor a escribir
 */
export const typeInInput = async (labelOrPlaceholder, value) => {
  const input =
    screen.getByLabelText(labelOrPlaceholder) ||
    screen.getByPlaceholderText(labelOrPlaceholder);

  await fireEvent.change(input, { target: { value } });
  return input;
};

/**
 * Simula un click en un botón identificado por texto
 * @param {string} buttonText - Texto del botón
 */
export const clickButton = async (buttonText) => {
  const button = screen.getByRole("button", {
    name: new RegExp(buttonText, "i"),
  });
  await fireEvent.click(button);
  return button;
};

/**
 * Espera a que aparezca un elemento con texto específico
 * @param {string} text - Texto a buscar
 * @param {Object} options - Opciones de waitFor
 */
export const waitForText = async (text, options = {}) => {
  return await waitFor(() => screen.getByText(new RegExp(text, "i")), {
    timeout: 3000,
    ...options,
  });
};

/**
 * Crea un mock de un servicio con métodos comunes
 * @param {Object} overrides - Métodos a sobrescribir
 * @returns {Object} Servicio mockeado
 */
export const createServiceMock = (overrides = {}) => ({
  // Métodos comunes de CRUD
  obtener: vi.fn().mockResolvedValue({ success: true, data: {} }),
  crear: vi.fn().mockResolvedValue({ success: true, id: "test-id" }),
  actualizar: vi.fn().mockResolvedValue({ success: true }),
  eliminar: vi.fn().mockResolvedValue({ success: true }),

  // Métodos de listado
  listar: vi.fn().mockResolvedValue({ success: true, data: [] }),
  buscar: vi.fn().mockResolvedValue({ success: true, data: [] }),

  // Sobrescribir con métodos específicos
  ...overrides,
});

/**
 * Crea datos mock para un evento
 * @param {Object} overrides - Propiedades a sobrescribir
 * @returns {Object} Datos del evento mock
 */
export const createMockEvento = (overrides = {}) => ({
  id: "evento-test-id",
  titulo: "Evento de Prueba",
  descripcion: "Descripción de prueba",
  fechaInicio: "2024-12-15",
  fechaFin: "2024-12-15",
  horaInicio: "09:00",
  horaFin: "17:00",
  ubicacion: "Aula Test",
  capacidad: 50,
  tipoEvento: "conferencia",
  modalidad: "presencial",
  estado: "publicado",
  organizadorId: "test-organizador-id",
  participantes: [],
  expositores: [],
  asistenciasPorDia: {},
  fechaCreacion: new Date("2024-12-01"),
  ...overrides,
});

/**
 * Crea datos mock para un usuario
 * @param {Object} overrides - Propiedades a sobrescribir
 * @returns {Object} Datos del usuario mock
 */
export const createMockUser = (overrides = {}) => ({
  uid: "test-user-id",
  email: "test@upao.edu.pe",
  nombre: "Test",
  apellido: "User",
  role: "alumno",
  fechaRegistro: new Date("2024-01-01"),
  emailVerificado: true,
  ...overrides,
});

/**
 * Simula una Promise que se resuelve después de un tiempo
 * @param {*} value - Valor a retornar
 * @param {number} delay - Retraso en ms
 */
export const resolveAfter = (value, delay = 100) =>
  new Promise((resolve) => setTimeout(() => resolve(value), delay));

/**
 * Simula una Promise que se rechaza después de un tiempo
 * @param {*} error - Error a lanzar
 * @param {number} delay - Retraso en ms
 */
export const rejectAfter = (error, delay = 100) =>
  new Promise((_, reject) => setTimeout(() => reject(error), delay));

/**
 * Crea mocks para las funciones de Firebase Auth
 * @returns {Object} Mocks de Firebase Auth
 */
export const createFirebaseAuthMocks = () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
});

/**
 * Crea mocks para las funciones de Firestore
 * @returns {Object} Mocks de Firestore
 */
export const createFirestoreMocks = () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
});

export default {
  renderWithRouter,
  typeInInput,
  clickButton,
  waitForText,
  createServiceMock,
  createMockEvento,
  createMockUser,
  resolveAfter,
  rejectAfter,
  createFirebaseAuthMocks,
  createFirestoreMocks,
};
