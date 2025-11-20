/**
 * Tests para RecuperarContrasenaModal - Modal de recuperación de contraseña
 * @fileoverview Tests unitarios para el componente de recuperación de contraseña
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import RecuperarContrasenaModal from "../../src/components/auth/RecuperarContrasenaModal";
import toastHelper from "../../src/core/utils/toastHelper";
import logger from "../../src/core/utils/logger";

// Mock de Firebase Auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock de helpers
vi.mock("../../src/core/utils/toastHelper", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../src/core/utils/logger", () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RecuperarContrasenaModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado y visibilidad", () => {
    it("no debería renderizarse cuando show=false", () => {
      // Act
      render(<RecuperarContrasenaModal show={false} onClose={mockOnClose} />);

      // Assert
      expect(
        screen.queryByText("Recuperar Contraseña")
      ).not.toBeInTheDocument();
    });

    it("debería renderizarse cuando show=true", () => {
      // Act
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText("Recuperar Contraseña")).toBeInTheDocument();
      expect(screen.getByLabelText("Correo Electrónico")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /enviar email/i })
      ).toBeInTheDocument();
    });

    it("debería mostrar el botón cerrar", () => {
      // Act
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByLabelText("Cerrar modal")).toBeInTheDocument();
    });

    it("debería cerrar modal al hacer click en X", () => {
      // Arrange
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText("Cerrar modal");

      // Act
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledOnce();
    });
  });

  describe("Validación de email", () => {
    it("debería mostrar error para email vacío", async () => {
      // Arrange
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");

      // Quitar atributo required temporalmente para el test
      emailInput.removeAttribute("required");

      // Act
      const form = emailInput.closest("form");
      fireEvent.submit(form);

      // Assert
      await waitFor(() => {
        expect(toastHelper.error).toHaveBeenCalledWith(
          "❌ Por favor, ingresa un email válido. Ejemplo: usuario@dominio.com"
        );
      });
    });

    it("debería mostrar error para email inválido", async () => {
      // Arrange
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");

      // Act
      fireEvent.change(emailInput, { target: { value: "email-inválido" } });
      emailInput.removeAttribute("required");
      const form = emailInput.closest("form");
      fireEvent.submit(form);

      // Assert
      await waitFor(() => {
        expect(toastHelper.error).toHaveBeenCalledWith(
          "❌ Por favor, ingresa un email válido. Ejemplo: usuario@dominio.com"
        );
      });
    });

    it("debería mostrar error para email sin dominio", async () => {
      // Arrange
      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");

      // Act
      fireEvent.change(emailInput, { target: { value: "test@" } });
      emailInput.removeAttribute("required");
      const form = emailInput.closest("form");
      fireEvent.submit(form);

      // Assert
      await waitFor(() => {
        expect(toastHelper.error).toHaveBeenCalledWith(
          "❌ Por favor, ingresa un email válido. Ejemplo: usuario@dominio.com"
        );
      });
    });
  });

  describe("Envío de email de recuperación", () => {
    it("debería enviar email exitosamente", async () => {
      // Arrange
      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");
      const submitButton = screen.getByRole("button", {
        name: /enviar email/i,
      });

      // Act
      fireEvent.change(emailInput, { target: { value: "test@upao.edu.pe" } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(
          { currentUser: null },
          "test@upao.edu.pe"
        );
        expect(toastHelper.success).toHaveBeenCalledWith(
          "✅ Email de recuperación enviado. Revisa tu bandeja de entrada y spam."
        );
        expect(logger.log).toHaveBeenCalledWith(
          "✅ Email de recuperación enviado a:",
          "test@upao.edu.pe"
        );
      });
    });

    it("debería manejar error de usuario no encontrado", async () => {
      // Arrange
      vi.mocked(sendPasswordResetEmail).mockRejectedValue({
        code: "auth/user-not-found",
        message: "Usuario no encontrado",
      });

      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");
      const submitButton = screen.getByRole("button", {
        name: /enviar email/i,
      });

      // Act
      fireEvent.change(emailInput, { target: { value: "test@upao.edu.pe" } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(toastHelper.error).toHaveBeenCalledWith(
          "❌ No existe una cuenta con este email."
        );
      });
    });

    it("debería manejar errores genéricos", async () => {
      // Arrange
      vi.mocked(sendPasswordResetEmail).mockRejectedValue({
        code: "auth/unknown-error",
        message: "Error desconocido",
      });

      render(<RecuperarContrasenaModal show={true} onClose={mockOnClose} />);
      const emailInput = screen.getByLabelText("Correo Electrónico");
      const submitButton = screen.getByRole("button", {
        name: /enviar email/i,
      });

      // Act
      fireEvent.change(emailInput, { target: { value: "test@upao.edu.pe" } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(toastHelper.error).toHaveBeenCalledWith(
          "❌ Error al enviar el email. Intenta de nuevo."
        );
        expect(logger.error).toHaveBeenCalledWith(
          "❌ Error al enviar email de recuperación:",
          { code: "auth/unknown-error", message: "Error desconocido" }
        );
      });
    });
  });
});
