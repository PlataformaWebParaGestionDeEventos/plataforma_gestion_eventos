/**
 * Tests para useAuth - Hook de autenticación
 * @fileoverview Tests unitarios para el hook personalizado de autenticación
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../../src/core/hooks/useAuth";
import { authService } from "../../src/services/authService";

// Mock del servicio de auth
vi.mock("../../src/services/authService", () => ({
  authService: {
    iniciarSesion: vi.fn(),
    registrarUsuario: vi.fn(),
    cerrarSesion: vi.fn(),
    reenviarVerificacion: vi.fn(),
    obtenerDatosUsuario: vi.fn(),
    onAuthStateChanged: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe("useAuth", () => {
  const mockUser = createMockUser();
  const mockUserData = {
    uid: mockUser.uid,
    nombre: "Test",
    apellido: "User",
    email: mockUser.email,
    role: "alumno",
    fechaRegistro: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Inicialización y estado de autenticación", () => {
    it("debería inicializar con estado de loading", () => {
      // Arrange
      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          // No llamar callback inmediatamente
          return vi.fn(); // unsubscribe function
        }
      );

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.userData).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("debería establecer usuario autenticado cuando Firebase Auth cambia", async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          // Simular callback inmediato con usuario verificado
          setTimeout(() => callback(verifiedUser), 0);
          return vi.fn();
        }
      );

      vi.mocked(authService).obtenerDatosUsuario.mockResolvedValue({
        success: true,
        userData: mockUserData,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(verifiedUser);
      expect(result.current.userData).toEqual(mockUserData);
      expect(result.current.role).toBe("alumno");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAlumno).toBe(true);
      expect(result.current.isOrganizador).toBe(false);
    });

    it("debería manejar usuario sin datos en Firestore", async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(verifiedUser), 0);
          return vi.fn();
        }
      );

      vi.mocked(authService).obtenerDatosUsuario.mockResolvedValue({
        success: false,
        error: "Usuario no encontrado",
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(verifiedUser);
      expect(result.current.userData).toBeNull();
      expect(result.current.role).toBe("alumno"); // rol por defecto
    });

    it("debería limpiar estado cuando no hay usuario autenticado", async () => {
      // Arrange
      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(null), 0);
          return vi.fn();
        }
      );

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userData).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAlumno).toBe(false);
      expect(result.current.isOrganizador).toBe(false);
    });
  });

  describe("Funciones de autenticación", () => {
    beforeEach(() => {
      // Setup básico para tests de funciones
      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          return vi.fn();
        }
      );
    });

    it("debería realizar login exitosamente", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth());
      vi.mocked(authService).iniciarSesion.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login("test@upao.edu.pe", "password123");
      });

      // Assert
      expect(loginResult.success).toBe(true);
      expect(vi.mocked(authService).iniciarSesion).toHaveBeenCalledWith(
        "test@upao.edu.pe",
        "password123"
      );
    });

    it("debería manejar error en login", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth());
      vi.mocked(authService).iniciarSesion.mockResolvedValue({
        success: false,
        error: "Credenciales incorrectas",
      });

      // Act
      const loginResult = await act(async () => {
        return await result.current.login("wrong@email.com", "wrongpass");
      });

      // Assert
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe("Credenciales incorrectas");
    });

    it("debería realizar registro exitosamente", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth());
      vi.mocked(authService).registrarUsuario.mockResolvedValue({
        success: true,
        user: mockUser,
        message: "Usuario registrado exitosamente",
      });

      // Act
      const registerResult = await act(async () => {
        return await result.current.register(
          "nuevo@upao.edu.pe",
          "password123",
          "Nuevo",
          "Usuario",
          "alumno"
        );
      });

      // Assert
      expect(registerResult.success).toBe(true);
      expect(vi.mocked(authService).registrarUsuario).toHaveBeenCalledWith(
        "nuevo@upao.edu.pe",
        "password123",
        "Nuevo",
        "Usuario",
        "alumno"
      );
    });

    it("debería realizar logout exitosamente", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth());
      vi.mocked(authService).cerrarSesion.mockResolvedValue({
        success: true,
      });

      // Act
      const logoutResult = await act(async () => {
        return await result.current.logout();
      });

      // Assert
      expect(logoutResult.success).toBe(true);
      expect(vi.mocked(authService).cerrarSesion).toHaveBeenCalled();
    });

    it("debería reenviar verificación de email", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth());
      vi.mocked(authService).reenviarVerificacion.mockResolvedValue({
        success: true,
        message: "Email de verificación enviado",
      });

      // Act
      const resendResult = await act(async () => {
        return await result.current.resendVerification();
      });

      // Assert
      expect(resendResult.success).toBe(true);
      expect(vi.mocked(authService).reenviarVerificacion).toHaveBeenCalled();
    });
  });

  describe("Helpers de rol", () => {
    it("debería identificar correctamente rol de organizador", async () => {
      // Arrange
      const organizadorUser = { ...mockUser, emailVerified: true };
      const organizadorData = { ...mockUserData, role: "organizador" };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(organizadorUser), 0);
          return vi.fn();
        }
      );

      vi.mocked(authService).obtenerDatosUsuario.mockResolvedValue({
        success: true,
        userData: organizadorData,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.role).toBe("organizador");
      expect(result.current.isOrganizador).toBe(true);
      expect(result.current.isAlumno).toBe(false);
    });

    it("debería identificar correctamente rol de alumno", async () => {
      // Arrange
      const alumnoUser = { ...mockUser, emailVerified: true };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(alumnoUser), 0);
          return vi.fn();
        }
      );

      vi.mocked(authService).obtenerDatosUsuario.mockResolvedValue({
        success: true,
        userData: mockUserData, // role: 'alumno'
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.role).toBe("alumno");
      expect(result.current.isAlumno).toBe(true);
      expect(result.current.isOrganizador).toBe(false);
    });
  });

  describe("Manejo de errores", () => {
    it("debería manejar error en obtenerDatosUsuario", async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(verifiedUser), 0);
          return vi.fn();
        }
      );

      vi.mocked(authService).obtenerDatosUsuario.mockRejectedValue(
        new Error("Error de red")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userData).toBeNull();
      expect(result.current.role).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error en useAuth:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("debería limpiar estado cuando usuario no tiene email verificado", async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, emailVerified: false };

      vi.mocked(authService).onAuthStateChanged.mockImplementation(
        (callback) => {
          setTimeout(() => callback(unverifiedUser), 0);
          return vi.fn();
        }
      );

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userData).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Cleanup y unsubscribe", () => {
    it("debería limpiar el listener al desmontar el componente", () => {
      // Arrange
      const unsubscribeMock = vi.fn();
      vi.mocked(authService).onAuthStateChanged.mockReturnValue(
        unsubscribeMock
      );

      // Act
      const { unmount } = renderHook(() => useAuth());
      unmount();

      // Assert
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
