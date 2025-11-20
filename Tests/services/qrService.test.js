/**
 * Tests para qrService - Gestión de códigos QR para asistencia
 * @fileoverview Tests unitarios para generación, validación y registro de QR
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { qrService } from "../../src/services/qrService";
import { mockEvento, mockDocumentSnapshot } from "../__mocks__/firebase";
import CryptoJS from "crypto-js";

// Permitir que CryptoJS funcione normalmente para generar tokens válidos
// No mockeamos CryptoJS para que los tokens sean consistentes

// Helper para generar tokens válidos como lo hace el servicio real
const SECRET_KEY = "upao-eventos-secret-key-2025"; // Mismo valor que en el servicio

function generateValidToken(qrId, eventoId, userId, fechaDia, timestamp) {
  const dataString = `${qrId}|${eventoId}|${userId}|${fechaDia}|${timestamp}`;
  return CryptoJS.SHA256(dataString + SECRET_KEY).toString();
}

// Mock de Firebase Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

// Mock de config
vi.mock("../../src/config/credenciales", () => ({
  db: {},
}));

// Mock de logger
vi.mock("../../src/core/utils/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("qrService", () => {
  const mockEventoId = "evento-test-id";
  const mockUserId = "user-test-id";
  const mockUserEmail = "test@upao.edu.pe";
  const mockFechaDia = "2024-12-15";

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset date mocks
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generarQRPorDia", () => {
    it("debería generar un QR válido para un día específico", () => {
      // Arrange & Act
      const result = qrService.generarQRPorDia(
        mockEventoId,
        mockUserId,
        mockUserEmail,
        mockFechaDia
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.qrData).toMatchObject({
        eventoId: mockEventoId,
        userId: mockUserId,
        userEmail: mockUserEmail,
        fechaDia: mockFechaDia,
        usado: false,
        version: "3.0",
      });
      expect(result.qrData.qrId).toContain("qr_2024-12-15_");
      expect(result.qrString).toBeTruthy();
      expect(result.token).toBe("mock-hash-token");
    });

    it("debería generar QR con ponente específico", () => {
      // Arrange
      const ponenteKey = "ponente-123";

      // Act
      const result = qrService.generarQRPorDia(
        mockEventoId,
        mockUserId,
        mockUserEmail,
        mockFechaDia,
        ponenteKey
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.qrData.ponenteKey).toBe(ponenteKey);
    });

    it("debería incluir buffer de expiración de 24 horas", () => {
      // Act
      const result = qrService.generarQRPorDia(
        mockEventoId,
        mockUserId,
        mockUserEmail,
        mockFechaDia
      );

      // Assert
      expect(result.qrData.expirationBuffer).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("generarQRsParaEvento", () => {
    it("debería generar QRs para múltiples días del evento", () => {
      // Arrange
      const diasEvento = ["2024-12-15", "2024-12-16", "2024-12-17"];

      // Act
      const result = qrService.generarQRsParaEvento(
        mockEventoId,
        mockUserId,
        mockUserEmail,
        diasEvento
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.totalQRs).toBe(3);
      expect(Object.keys(result.qrsPorDia)).toEqual(diasEvento);

      // Verificar estructura de cada QR
      diasEvento.forEach((fecha) => {
        expect(result.qrsPorDia[fecha]).toMatchObject({
          qrString: expect.any(String),
          qrId: expect.stringContaining(`qr_${fecha}_`),
          token: "mock-hash-token",
          fechaDia: fecha,
          usado: false,
        });
      });
    });

    it("debería manejar array vacío de días", () => {
      // Act
      const result = qrService.generarQRsParaEvento(
        mockEventoId,
        mockUserId,
        mockUserEmail,
        []
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.totalQRs).toBe(0);
      expect(result.qrsPorDia).toEqual({});
    });
  });

  describe("validarQR", () => {
    let validQRData;

    beforeEach(() => {
      const qrId = "qr_2024-12-15_test";
      const timestamp = "2024-12-15T10:00:00.000Z";

      validQRData = {
        qrId,
        eventoId: mockEventoId,
        userId: mockUserId,
        fechaDia: mockFechaDia,
        token: generateValidToken(
          qrId,
          mockEventoId,
          mockUserId,
          mockFechaDia,
          timestamp
        ),
        timestamp,
        version: "3.0",
      };
    });

    it("debería validar un QR válido exitosamente", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const validEvento = {
        ...mockEvento,
        participantes: [mockUserId],
        asistenciasPorDia: {},
      };

      const mockEventoDoc = {
        exists: () => true,
        data: () => validEvento,
      };

      getDoc.mockResolvedValue(mockEventoDoc);
      const qrString = JSON.stringify(validQRData);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.estado).toBe("valido");
      expect(result.qrData).toMatchObject(validQRData);
      expect(result.mensaje).toContain("QR válido");
    });

    it("debería rechazar QR con formato incorrecto", async () => {
      // Act
      const result = await qrService.validarQR("invalid-json", mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("error");
    });

    it("debería rechazar QR sin qrId (formato antiguo)", async () => {
      // Arrange
      const oldFormatQR = { eventoId: mockEventoId, userId: mockUserId };
      const qrString = JSON.stringify(oldFormatQR);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("invalido");
      expect(result.error).toContain("Formato antiguo o corrupto");
    });

    it("debería rechazar QR sin fechaDia", async () => {
      // Arrange
      const qrWithoutDate = { ...validQRData };
      delete qrWithoutDate.fechaDia;
      const qrString = JSON.stringify(qrWithoutDate);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("invalido");
      expect(result.error).toContain("Sin fecha específica del día");
    });

    it("debería rechazar QR de otro evento", async () => {
      // Arrange
      const qrOtroEvento = { ...validQRData, eventoId: "otro-evento-id" };
      const qrString = JSON.stringify(qrOtroEvento);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("evento_incorrecto");
      expect(result.error).toContain("Este QR es de otro evento");
    });

    it("debería rechazar QR con token inválido", async () => {
      // Arrange
      const qrTokenInvalido = { ...validQRData, token: "token-incorrecto" };
      const qrString = JSON.stringify(qrTokenInvalido);

      // Mock CryptoJS to return different token
      CryptoJS.SHA256.mockReturnValue({
        toString: vi.fn().mockReturnValue("different-hash"),
      });

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("token_invalido");
      expect(result.error).toContain("Token de seguridad no válido");
    });

    it("debería rechazar QR de usuario no inscrito", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const eventoSinUsuario = {
        ...mockEvento,
        participantes: ["otro-usuario-id"], // Usuario no incluido
      };

      const mockEventoDoc = {
        exists: () => true,
        data: () => eventoSinUsuario,
      };

      getDoc.mockResolvedValue(mockEventoDoc);
      const qrString = JSON.stringify(validQRData);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("no_inscrito");
      expect(result.error).toContain("no está inscrito");
    });

    it("debería rechazar QR ya usado previamente", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const eventoConQRUsado = {
        ...mockEvento,
        participantes: [mockUserId],
        qrUsados: {
          [validQRData.qrId]: {
            timestamp: "2024-12-15T09:00:00.000Z",
            userId: mockUserId,
          },
        },
      };

      const mockEventoDoc = {
        exists: () => true,
        data: () => eventoConQRUsado,
      };

      getDoc.mockResolvedValue(mockEventoDoc);
      const qrString = JSON.stringify(validQRData);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("qr_ya_usado");
      expect(result.error).toContain("QR ya fue escaneado");
    });

    it("debería rechazar QR si ya hay asistencia registrada para el día", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const eventoConAsistencia = {
        ...mockEvento,
        participantes: [mockUserId],
        modoAsistencia: "por_dia",
        asistenciasPorDia: {
          [mockFechaDia]: {
            asistentes: [mockUserId], // Ya tiene asistencia
          },
        },
      };

      const mockEventoDoc = {
        exists: () => true,
        data: () => eventoConAsistencia,
      };

      getDoc.mockResolvedValue(mockEventoDoc);
      const qrString = JSON.stringify(validQRData);

      // Act
      const result = await qrService.validarQR(qrString, mockEventoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.estado).toBe("asistencia_ya_registrada");
      expect(result.error).toContain(
        "Ya se registró la asistencia para el día"
      );
    });
  });

  describe("obtenerEstadisticasQR", () => {
    it("debería obtener estadísticas correctas del evento", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      const eventoConAsistencias = {
        ...mockEvento,
        participantes: ["user1", "user2", "user3", "user4"],
        asistenciasPorDia: {
          "2024-12-15": {
            asistentes: ["user1", "user2"],
            participantesInfo: [
              { uid: "user1", metodo: "qr" },
              { uid: "user2", metodo: "manual" },
            ],
          },
          "2024-12-16": {
            asistentes: ["user3"],
            participantesInfo: [{ uid: "user3", metodo: "qr" }],
          },
        },
      };

      const mockEventoDoc = {
        exists: () => true,
        data: () => eventoConAsistencias,
      };

      getDoc.mockResolvedValue(mockEventoDoc);

      // Act
      const result = await qrService.obtenerEstadisticasQR(mockEventoId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.estadisticas).toMatchObject({
        totalInscritos: 4,
        totalAsistentes: 3,
        asistentesPorQR: expect.any(Number),
        asistentesManual: expect.any(Number),
        porcentajeAsistencia: "75.0",
        porcentajeQR: expect.any(String),
      });
    });

    it("debería manejar evento no encontrado", async () => {
      // Arrange
      const { getDoc } = await import("firebase/firestore");
      getDoc.mockResolvedValue({ exists: () => false });

      // Act
      const result = await qrService.obtenerEstadisticasQR(
        "evento-inexistente"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Evento no encontrado");
    });
  });
});
