/**
 * Tests para formatters - Utilidades de formato de datos
 * @fileoverview Tests unitarios para todas las funciones de formateo
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { formatters } from "../../src/core/utils/formatters";

describe("formatters", () => {
  beforeEach(() => {
    // Configurar timezone para pruebas consistentes
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Formateo básico de fechas y texto", () => {
    it("formatDate debería formatear fecha correctamente", () => {
      // Arrange
      const fecha = "2024-12-15";

      // Act
      const resultado = formatters.formatDate(fecha);

      // Assert - Acepta tanto UTC como local timezone
      expect(resultado).toMatch(/(14|15) de diciembre de 2024/);
    });

    it("formatDate debería manejar fecha null/undefined", () => {
      expect(formatters.formatDate(null)).toBe("");
      expect(formatters.formatDate(undefined)).toBe("");
    });

    it("formatTime debería retornar la hora tal como se pasa", () => {
      expect(formatters.formatTime("14:30")).toBe("14:30");
      expect(formatters.formatTime(null)).toBe("");
    });

    it("formatDateTime debería combinar fecha y hora", () => {
      // Act
      const resultado = formatters.formatDateTime("2024-12-15", "14:30");

      // Assert - Acepta tanto UTC como local timezone
      expect(resultado).toMatch(/(14|15) de diciembre de 2024 a las 14:30/);
    });

    it("formatDateTime debería manejar valores faltantes", () => {
      expect(formatters.formatDateTime(null, "14:30")).toBe("");
      expect(formatters.formatDateTime("2024-12-15", null)).toBe("");
    });

    it("truncateText debería truncar texto largo", () => {
      // Arrange
      const textoLargo = "Este es un texto muy largo que debe ser truncado";

      // Act
      const resultado = formatters.truncateText(textoLargo, 20);

      // Assert
      expect(resultado).toBe("Este es un texto muy...");
      expect(resultado.length).toBe(23); // 20 + '...'
    });

    it("truncateText no debería truncar texto corto", () => {
      const textoCorto = "Texto corto";
      const resultado = formatters.truncateText(textoCorto, 20);
      expect(resultado).toBe("Texto corto");
    });

    it("capitalize debería capitalizar primera letra", () => {
      expect(formatters.capitalize("hola mundo")).toBe("Hola mundo");
      expect(formatters.capitalize("HOLA MUNDO")).toBe("Hola mundo");
      expect(formatters.capitalize("")).toBe("");
      expect(formatters.capitalize(null)).toBe("");
    });
  });

  describe("Formateo de eventos y participantes", () => {
    it("formatParticipants debería formatear número de participantes", () => {
      expect(formatters.formatParticipants(25, 100)).toBe("25/100");
      expect(formatters.formatParticipants(null, 100)).toBe("0/100");
      expect(formatters.formatParticipants(undefined, 50)).toBe("0/50");
    });

    it("getCapacityPercentage debería calcular porcentaje correctamente", () => {
      expect(formatters.getCapacityPercentage(25, 100)).toBe(25);
      expect(formatters.getCapacityPercentage(33, 100)).toBe(33);
      expect(formatters.getCapacityPercentage(67, 100)).toBe(67);
      expect(formatters.getCapacityPercentage(0, 100)).toBe(0);
      expect(formatters.getCapacityPercentage(25, 0)).toBe(0);
      expect(formatters.getCapacityPercentage(null, 100)).toBe(0);
    });

    it("formatEventStatus debería formatear estados del evento", () => {
      expect(formatters.formatEventStatus("borrador")).toBe("📝 Borrador");
      expect(formatters.formatEventStatus("publicado")).toBe("✅ Publicado");
      expect(formatters.formatEventStatus("cancelado")).toBe("❌ Cancelado");
      expect(formatters.formatEventStatus("finalizado")).toBe("🏁 Finalizado");
      expect(formatters.formatEventStatus("estado_desconocido")).toBe(
        "estado_desconocido"
      );
    });

    it("formatEventType debería formatear tipos de evento", () => {
      expect(formatters.formatEventType("conferencia")).toBe("Conferencia");
      expect(formatters.formatEventType("seminario")).toBe("Seminario");
      expect(formatters.formatEventType("taller")).toBe("Taller");
      expect(formatters.formatEventType("curso")).toBe("Curso");
      expect(formatters.formatEventType("charla")).toBe("Charla");
      expect(formatters.formatEventType("tipo_personalizado")).toBe(
        "tipo_personalizado"
      );
    });
  });

  describe("Funciones para eventos multi-día", () => {
    it("calcularDiasEvento debería calcular todos los días entre fechas", () => {
      // Act
      const dias = formatters.calcularDiasEvento("2024-12-15", "2024-12-17");

      // Assert
      expect(dias).toEqual(["2024-12-15", "2024-12-16", "2024-12-17"]);
    });

    it("calcularDiasEvento debería manejar evento de un solo día", () => {
      const dias = formatters.calcularDiasEvento("2024-12-15", "2024-12-15");
      expect(dias).toEqual(["2024-12-15"]);
    });

    it("calcularDiasEvento debería manejar fechas faltantes", () => {
      expect(formatters.calcularDiasEvento(null, "2024-12-15")).toEqual([]);
      expect(formatters.calcularDiasEvento("2024-12-15", null)).toEqual([]);
    });

    it("esEventoMultiDia debería detectar eventos multi-día", () => {
      expect(formatters.esEventoMultiDia("2024-12-15", "2024-12-17")).toBe(
        true
      );
      expect(formatters.esEventoMultiDia("2024-12-15", "2024-12-15")).toBe(
        false
      );
      expect(formatters.esEventoMultiDia(null, "2024-12-15")).toBe(false);
    });

    it("formatearRangoFechas debería formatear rangos de fechas", () => {
      // Evento de un día
      const eventoUnDia = formatters.formatearRangoFechas(
        "2024-12-15",
        "2024-12-15"
      );
      expect(eventoUnDia).toMatch(/(14|15) de diciembre de 2024/);

      // Evento multi-día
      const eventoMultiDia = formatters.formatearRangoFechas(
        "2024-12-15",
        "2024-12-17"
      );
      expect(eventoMultiDia).toBe("15 dic al 17 dic 2024");

      // Sin fecha
      expect(formatters.formatearRangoFechas(null, null)).toBe(
        "No especificada"
      );
    });

    it("obtenerFechaActual debería retornar fecha actual en formato YYYY-MM-DD", () => {
      const fechaActual = formatters.obtenerFechaActual();
      expect(fechaActual).toBe("2024-12-15");
    });

    it("esFechaDentroDelEvento debería validar fechas dentro del rango", () => {
      expect(
        formatters.esFechaDentroDelEvento(
          "2024-12-16",
          "2024-12-15",
          "2024-12-17"
        )
      ).toBe(true);
      expect(
        formatters.esFechaDentroDelEvento(
          "2024-12-15",
          "2024-12-15",
          "2024-12-17"
        )
      ).toBe(true);
      expect(
        formatters.esFechaDentroDelEvento(
          "2024-12-17",
          "2024-12-15",
          "2024-12-17"
        )
      ).toBe(true);
      expect(
        formatters.esFechaDentroDelEvento(
          "2024-12-14",
          "2024-12-15",
          "2024-12-17"
        )
      ).toBe(false);
      expect(
        formatters.esFechaDentroDelEvento(
          "2024-12-18",
          "2024-12-15",
          "2024-12-17"
        )
      ).toBe(false);
    });

    it("esUltimoDiaDelEvento debería detectar último día del evento", () => {
      expect(formatters.esUltimoDiaDelEvento("2024-12-15")).toBe(true); // Hoy es 2024-12-15
      expect(formatters.esUltimoDiaDelEvento("2024-12-16")).toBe(false);
      expect(formatters.esUltimoDiaDelEvento(null)).toBe(false);
    });

    it("formatearNombreDia debería formatear nombre del día", () => {
      const nombreDia = formatters.formatearNombreDia("2024-12-15");
      expect(nombreDia).toMatch(/domingo,? (14|15) dic/);
    });

    it("calcularPorcentajeAsistenciaParticipante debería calcular porcentaje", () => {
      expect(formatters.calcularPorcentajeAsistenciaParticipante(2, 3)).toBe(
        "66.67"
      );
      expect(formatters.calcularPorcentajeAsistenciaParticipante(3, 3)).toBe(
        "100.00"
      );
      expect(formatters.calcularPorcentajeAsistenciaParticipante(0, 3)).toBe(
        "0.00"
      );
      expect(formatters.calcularPorcentajeAsistenciaParticipante(1, 0)).toBe(
        "0.00"
      );
    });
  });

  describe("Funciones de asistencia avanzadas", () => {
    const mockEvento = {
      asistenciasPorDia: {
        "2024-12-15": {
          asistentes: ["user1", "user2"],
          participantesInfo: [
            { uid: "user1", metodo: "qr" },
            { uid: "user2", metodo: "manual" },
          ],
        },
        "2024-12-16": {
          asistentes: ["user1", "user3"],
          participantesInfo: [
            { uid: "user1", metodo: "qr" },
            { uid: "user3", metodo: "qr" },
          ],
        },
      },
    };

    it("obtenerAsistentesGlobales debería obtener asistentes únicos", () => {
      const asistentes = formatters.obtenerAsistentesGlobales(mockEvento);
      expect(asistentes).toEqual(
        expect.arrayContaining(["user1", "user2", "user3"])
      );
      expect(asistentes.length).toBe(3);
    });

    it("obtenerAsistentesGlobales debería manejar evento sin asistencias", () => {
      const eventoVacio = { asistenciasPorDia: {} };
      const asistentes = formatters.obtenerAsistentesGlobales(eventoVacio);
      expect(asistentes).toEqual([]);
    });

    it("obtenerAsistentesGlobales debería manejar evento null", () => {
      const asistentes = formatters.obtenerAsistentesGlobales(null);
      expect(asistentes).toEqual([]);
    });

    it("obtenerMetodoRegistro debería obtener método para fecha específica", () => {
      const metodo = formatters.obtenerMetodoRegistro(
        mockEvento,
        "user1",
        "2024-12-15"
      );
      expect(metodo).toBe("qr");

      const metodo2 = formatters.obtenerMetodoRegistro(
        mockEvento,
        "user2",
        "2024-12-15"
      );
      expect(metodo2).toBe("manual");
    });

    it("obtenerMetodoRegistro debería obtener método sin especificar fecha", () => {
      const metodo = formatters.obtenerMetodoRegistro(mockEvento, "user1");
      expect(metodo).toBe("qr"); // Primera ocurrencia encontrada
    });

    it("obtenerMetodoRegistro debería retornar null si no encuentra usuario", () => {
      const metodo = formatters.obtenerMetodoRegistro(
        mockEvento,
        "usuario_inexistente"
      );
      expect(metodo).toBeNull();
    });

    it("obtenerMetodoRegistro debería manejar participantesInfo no-array", () => {
      const eventoConError = {
        asistenciasPorDia: {
          "2024-12-15": {
            asistentes: ["user1"],
            participantesInfo: null, // Error: no es array
          },
        },
      };

      const metodo = formatters.obtenerMetodoRegistro(
        eventoConError,
        "user1",
        "2024-12-15"
      );
      expect(metodo).toBeNull();
    });
  });
});
