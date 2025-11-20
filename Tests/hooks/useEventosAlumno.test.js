/**
 * Tests para useEventosAlumno - Hook de gestión de eventos para alumnos
 * @fileoverview Tests unitarios para el hook con React Query
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEventosAlumno } from "../../src/core/hooks/useEventosAlumno";
import { createMockEvento, createMockUser } from "../testUtils";

// Mock de servicios
const mockFirestoreService = {
  obtenerEventosPublicados: vi.fn(),
  inscribirAlumnoEvento: vi.fn(),
  desinscribirAlumnoEvento: vi.fn(),
};

const mockUser = createMockUser();
const mockUserData = {
  uid: mockUser.uid,
  nombre: "Test",
  apellido: "User",
  role: "alumno",
};

const mockUseAuth = {
  user: mockUser,
  userData: mockUserData,
  isAuthenticated: true,
};

vi.mock("../../src/services/firestoreService", () => ({
  firestoreService: mockFirestoreService,
}));

vi.mock("../../src/core/hooks/useAuth", () => ({
  useAuth: vi.fn(() => mockUseAuth),
}));

vi.mock("../../src/core/utils/logger", () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../src/core/utils/toastHelper", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useEventosAlumno", () => {
  let mockEventos;

  beforeEach(() => {
    vi.clearAllMocks();

    // Eventos mock para las pruebas
    mockEventos = [
      createMockEvento({
        id: "evento-1",
        titulo: "Conferencia React",
        participantes: [mockUser.uid], // Usuario inscrito
      }),
      createMockEvento({
        id: "evento-2",
        titulo: "Taller JavaScript",
        participantes: [], // Usuario no inscrito
      }),
      createMockEvento({
        id: "evento-3",
        titulo: "Seminario Node.js",
        participantes: ["otro-usuario-id"], // Otro usuario
      }),
    ];
  });

  describe("Carga inicial de eventos", () => {
    it("debería cargar eventos publicados exitosamente", async () => {
      // Arrange
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });

      // Act
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.eventosDisponibles).toHaveLength(3);
      expect(result.current.eventosInscritos).toHaveLength(1);
      expect(result.current.eventosInscritos[0].id).toBe("evento-1");
    });

    it("debería mostrar loading durante la carga inicial", () => {
      // Arrange
      mockFirestoreService.obtenerEventosPublicados.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Act
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.loading).toBe(true);
      expect(result.current.loadingEventos).toBe(true);
    });

    it("debería manejar error en carga de eventos", async () => {
      // Arrange
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: false,
        error: "Error de conexión",
      });

      // Act
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toContain("Error de conexión");
    });

    it("no debería ejecutar query si no hay usuario autenticado", () => {
      // Arrange
      const { useAuth } = require("../../src/core/hooks/useAuth");
      useAuth.mockReturnValue({ user: null, userData: null });

      // Act
      renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(
        mockFirestoreService.obtenerEventosPublicados
      ).not.toHaveBeenCalled();
    });
  });

  describe("Inscripción a eventos", () => {
    beforeEach(() => {
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });
    });

    it("debería inscribirse a un evento exitosamente", async () => {
      // Arrange
      mockFirestoreService.inscribirAlumnoEvento.mockResolvedValue({
        success: true,
        mensaje: "Inscripción exitosa",
      });

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      let inscripcionResult;
      await act(async () => {
        inscripcionResult = await result.current.inscribirseEvento("evento-2");
      });

      // Assert
      expect(inscripcionResult.success).toBe(true);
      expect(mockFirestoreService.inscribirAlumnoEvento).toHaveBeenCalledWith(
        "evento-2",
        mockUser.uid,
        mockUser.email,
        "Test",
        "User"
      );
    });

    it("debería manejar error durante inscripción", async () => {
      // Arrange
      mockFirestoreService.inscribirAlumnoEvento.mockResolvedValue({
        success: false,
        error: "Evento lleno",
      });

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      let inscripcionResult;
      await act(async () => {
        inscripcionResult = await result.current.inscribirseEvento("evento-2");
      });

      // Assert
      expect(inscripcionResult.success).toBe(false);
      expect(inscripcionResult.error).toBe("Evento lleno");
    });

    it("debería fallar si no hay usuario autenticado", async () => {
      // Arrange
      const { useAuth } = require("../../src/core/hooks/useAuth");
      useAuth.mockReturnValue({ user: null, userData: null });

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      // Act & Assert
      await act(async () => {
        const inscripcionResult = await result.current.inscribirseEvento(
          "evento-2"
        );
        expect(inscripcionResult.success).toBe(false);
        expect(inscripcionResult.error).toBe("Usuario no autenticado");
      });
    });
  });

  describe("Desinscripción de eventos", () => {
    beforeEach(() => {
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });
    });

    it("debería desinscribirse de un evento exitosamente", async () => {
      // Arrange
      mockFirestoreService.desinscribirAlumnoEvento.mockResolvedValue({
        success: true,
        mensaje: "Desinscripción exitosa",
      });

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      let desinscripcionResult;
      await act(async () => {
        desinscripcionResult = await result.current.desinscribirseEvento(
          "evento-1"
        );
      });

      // Assert
      expect(desinscripcionResult.success).toBe(true);
      expect(
        mockFirestoreService.desinscribirAlumnoEvento
      ).toHaveBeenCalledWith("evento-1", mockUser.uid);
    });

    it("debería manejar error durante desinscripción", async () => {
      // Arrange
      mockFirestoreService.desinscribirAlumnoEvento.mockResolvedValue({
        success: false,
        error: "No se puede desinscribir",
      });

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      let desinscripcionResult;
      await act(async () => {
        desinscripcionResult = await result.current.desinscribirseEvento(
          "evento-1"
        );
      });

      // Assert
      expect(desinscripcionResult.success).toBe(false);
      expect(desinscripcionResult.error).toBe("No se puede desinscribir");
    });
  });

  describe("Funciones helper", () => {
    beforeEach(async () => {
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });
    });

    it("estaInscrito debería detectar correctamente la inscripción", async () => {
      // Act
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      expect(result.current.estaInscrito("evento-1")).toBe(true);
      expect(result.current.estaInscrito("evento-2")).toBe(false);
      expect(result.current.estaInscrito("evento-inexistente")).toBe(false);
    });

    it("obtenerEvento debería retornar el evento correcto", async () => {
      // Act
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert
      const evento = result.current.obtenerEvento("evento-1");
      expect(evento).toEqual(mockEventos[0]);

      const eventoInexistente =
        result.current.obtenerEvento("evento-inexistente");
      expect(eventoInexistente).toBeNull();
    });

    it("cargarEventos debería refrescar los datos", async () => {
      // Arrange
      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFirestoreService.obtenerEventosPublicados.mockClear();

      // Act
      await act(async () => {
        result.current.cargarEventos();
      });

      // Assert
      await waitFor(() => {
        expect(
          mockFirestoreService.obtenerEventosPublicados
        ).toHaveBeenCalled();
      });
    });
  });

  describe("Estados de carga", () => {
    it("debería mostrar estado de inscribiendo", async () => {
      // Arrange
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });

      let resolveInscripcion;
      mockFirestoreService.inscribirAlumnoEvento.mockReturnValue(
        new Promise((resolve) => {
          resolveInscripcion = resolve;
        })
      );

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      act(() => {
        result.current.inscribirseEvento("evento-2");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isInscribiendo).toBe(true);
        expect(result.current.loading).toBe(true);
      });

      // Cleanup
      act(() => {
        resolveInscripcion({ success: true });
      });
    });

    it("debería mostrar estado de desinscribiendo", async () => {
      // Arrange
      mockFirestoreService.obtenerEventosPublicados.mockResolvedValue({
        success: true,
        eventos: mockEventos,
      });

      let resolveDesinscripcion;
      mockFirestoreService.desinscribirAlumnoEvento.mockReturnValue(
        new Promise((resolve) => {
          resolveDesinscripcion = resolve;
        })
      );

      const { result } = renderHook(() => useEventosAlumno(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act
      act(() => {
        result.current.desinscribirseEvento("evento-1");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isDesinscribiendo).toBe(true);
        expect(result.current.loading).toBe(true);
      });

      // Cleanup
      act(() => {
        resolveDesinscripcion({ success: true });
      });
    });
  });
});
