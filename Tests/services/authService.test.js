/**
 * Tests para authService - Gestión de autenticación de usuarios
 * @fileoverview Tests unitarios para el servicio de autenticación con Firebase
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { authService } from "../../src/services/authService";
import {
  mockUser,
  mockAuth,
  mockDocumentSnapshot,
  onAuthStateChanged,
} from "../__mocks__/firebase";

// Mock de Firebase functions
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuth),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: vi.fn(),
  onAuthStateChanged,
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("../../src/config/credenciales", () => ({
  db: {},
  default: { name: "test-app" },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registrarUsuario", () => {
    it("debería registrar un nuevo usuario exitosamente", async () => {
      // Arrange
      const mockUserCredential = { user: mockUser };
      const { createUserWithEmailAndPassword, sendEmailVerification } =
        await import("firebase/auth");
      const { setDoc } = await import("firebase/firestore");

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      sendEmailVerification.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);

      // Act
      const result = await authService.registrarUsuario(
        "test@upao.edu.pe",
        "password123",
        "Juan",
        "Pérez",
        "alumno"
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.message).toContain("Usuario registrado");
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        "test@upao.edu.pe",
        "password123"
      );
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
    });

    it("debería manejar error de email ya en uso", async () => {
      // Arrange
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/email-already-in-use",
      });

      // Act
      const result = await authService.registrarUsuario(
        "existing@upao.edu.pe",
        "password123",
        "Juan",
        "Pérez"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Este email ya está registrado");
    });

    it("debería manejar error de contraseña débil", async () => {
      // Arrange
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      createUserWithEmailAndPassword.mockRejectedValue({
        code: "auth/weak-password",
      });

      // Act
      const result = await authService.registrarUsuario(
        "test@upao.edu.pe",
        "123",
        "Juan",
        "Pérez"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "La contraseña debe tener al menos 6 caracteres"
      );
    });
  });

  describe("iniciarSesion", () => {
    it("debería iniciar sesión exitosamente con email verificado", async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };
      const mockUserCredential = { user: verifiedUser };
      const { signInWithEmailAndPassword } = await import("firebase/auth");

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      // Act
      const result = await authService.iniciarSesion(
        "test@upao.edu.pe",
        "password123"
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(verifiedUser);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        "test@upao.edu.pe",
        "password123"
      );
    });

    it("debería rechazar login si el email no está verificado", async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, emailVerified: false };
      const mockUserCredential = { user: unverifiedUser };
      const { signInWithEmailAndPassword, signOut } = await import(
        "firebase/auth"
      );

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      signOut.mockResolvedValue(undefined);

      // Act
      const result = await authService.iniciarSesion(
        "test@upao.edu.pe",
        "password123"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Debes verificar tu email antes de iniciar sesión"
      );
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it("debería manejar credenciales incorrectas", async () => {
      // Arrange
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      signInWithEmailAndPassword.mockRejectedValue({
        code: "auth/user-not-found",
      });

      // Act
      const result = await authService.iniciarSesion(
        "wrong@email.com",
        "wrongpass"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email o contraseña incorrectos");
    });
  });

  describe("cerrarSesion", () => {
    it("debería cerrar sesión exitosamente", async () => {
      // Arrange
      const { signOut } = await import("firebase/auth");
      signOut.mockResolvedValue(undefined);

      // Act
      const result = await authService.cerrarSesion();

      // Assert
      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it("debería manejar error al cerrar sesión", async () => {
      // Arrange
      const { signOut } = await import("firebase/auth");
      signOut.mockRejectedValue(new Error("Network error"));

      // Act
      const result = await authService.cerrarSesion();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al cerrar sesión");
    });
  });

  describe("obtenerDatosUsuario", () => {
    it("debería obtener datos del usuario existente", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      getDoc.mockResolvedValue(mockDocumentSnapshot);

      // Act
      const result = await authService.obtenerDatosUsuario("test-user-id");

      // Assert
      expect(result.success).toBe(true);
      expect(result.userData).toEqual(mockDocumentSnapshot.data());
      expect(getDoc).toHaveBeenCalled();
    });

    it("debería manejar usuario no encontrado", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const mockEmptyDoc = { exists: () => false };
      getDoc.mockResolvedValue(mockEmptyDoc);

      // Act
      const result = await authService.obtenerDatosUsuario("nonexistent-user");

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Usuario no encontrado");
    });
  });

  describe("reenviarVerificacion", () => {
    it("debería reenviar email de verificación si hay usuario autenticado", async () => {
      // Arrange
      const { sendEmailVerification } = await import("firebase/auth");
      sendEmailVerification.mockResolvedValue(undefined);
      mockAuth.currentUser = mockUser;

      // Act
      const result = await authService.reenviarVerificacion();

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Email de verificación enviado");
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it("debería fallar si no hay usuario autenticado", async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const result = await authService.reenviarVerificacion();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
    });
  });

  describe("getCurrentUser", () => {
    it("debería retornar el usuario actual", () => {
      // Arrange
      mockAuth.currentUser = mockUser;

      // Act
      const currentUser = authService.getCurrentUser();

      // Assert
      expect(currentUser).toEqual(mockUser);
    });

    it("debería retornar null si no hay usuario", () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const currentUser = authService.getCurrentUser();

      // Assert
      expect(currentUser).toBeNull();
    });
  });
});
