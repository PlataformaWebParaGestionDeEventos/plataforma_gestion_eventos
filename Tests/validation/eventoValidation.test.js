/**
 * Tests para eventoValidation - Validación de eventos y expositores
 * @fileoverview Tests unitarios para esquemas Yup de validación
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  eventoSchema,
  expositorSchema,
  validateEvento,
  validateExpositor,
  validateSync,
} from "../../src/core/validation/eventoValidation";

describe("eventoValidation", () => {
  describe("expositorSchema", () => {
    const expositorValido = {
      nombre: "Dr. Juan Pérez",
      correo: "juan.perez@upao.edu.pe",
      tema: "Inteligencia Artificial en la Educación",
      dia: "2025-12-15",
      hora: "10:00",
      duracion: 60,
      break: true,
    };

    it("debería validar expositor válido", async () => {
      // Act & Assert
      expect(async () => {
        await expositorSchema.validate(expositorValido);
      }).not.toThrow();
    });

    it("debería rechazar expositor con nombre muy corto", async () => {
      // Arrange
      const expositorInvalido = { ...expositorValido, nombre: "A" };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "El nombre debe tener al menos"
      );
    });

    it("debería rechazar expositor con correo inválido", async () => {
      // Arrange
      const expositorInvalido = {
        ...expositorValido,
        correo: "correo-invalido",
      };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "Debe ser un correo electrónico válido"
      );
    });

    it("debería rechazar expositor con tema muy largo", async () => {
      // Arrange
      const temaLargo = "A".repeat(301); // Más de 300 caracteres (límite actual)
      const expositorInvalido = { ...expositorValido, tema: temaLargo };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "El tema no puede exceder"
      );
    });

    it("debería rechazar día con formato incorrecto", async () => {
      // Arrange
      const expositorInvalido = { ...expositorValido, dia: "15-12-2024" };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "El día debe estar en formato YYYY-MM-DD"
      );
    });

    it("debería rechazar hora con formato incorrecto", async () => {
      // Arrange
      const expositorInvalido = { ...expositorValido, hora: "10:00:00" };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "La hora debe estar en formato HH:MM"
      );
    });

    it("debería rechazar hora inválida", async () => {
      // Arrange
      const expositorInvalido = { ...expositorValido, hora: "25:90" };

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "La hora debe estar en formato 24h válido"
      );
    });

    it("debería rechazar duración fuera de rango", async () => {
      // Arrange
      const expositorInvalido = { ...expositorValido, duracion: 500 }; // Más de 480 minutos

      // Act & Assert
      await expect(expositorSchema.validate(expositorInvalido)).rejects.toThrow(
        "La duración máxima es"
      );
    });

    it("debería rechazar campos faltantes", async () => {
      // Arrange
      const expositorIncompleto = { nombre: "Dr. Test" };

      // Act & Assert
      await expect(
        expositorSchema.validate(expositorIncompleto)
      ).rejects.toThrow();
    });
  });

  describe("eventoSchema", () => {
    const eventoValido = {
      titulo: "Conferencia de Tecnología 2024",
      descripcion:
        "Una conferencia sobre las últimas tendencias en tecnología y desarrollo",
      ubicacion: "Aula Magna - Campus Principal",
      capacidadMaxima: 100,
      tipo: "conferencia",
      estado: "borrador",
      fechaInicio: "2025-12-20",
      fechaFin: "2025-12-21",
      horaInicio: "09:00",
      horaFin: "17:00",
      modoAsistencia: "por_dia",
      expositores: [
        {
          nombre: "Dr. Ana García",
          correo: "ana.garcia@upao.edu.pe",
          tema: "React y el Futuro del Frontend",
          dia: "2025-12-20",
          hora: "09:30",
          duracion: 90,
          break: false,
        },
      ],
      inscripcionesAbiertas: true,
      asistenciaAbierta: true,
    };

    it("debería validar evento válido", async () => {
      // Act & Assert
      expect(async () => {
        await eventoSchema.validate(eventoValido);
      }).not.toThrow();
    });

    it("debería rechazar título muy corto", async () => {
      // Arrange
      const eventoInvalido = { ...eventoValido, titulo: "ABC" };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "El título debe tener al menos"
      );
    });

    it("debería rechazar descripción muy larga", async () => {
      // Arrange
      const descripcionLarga = "A".repeat(501);
      const eventoInvalido = { ...eventoValido, descripcion: descripcionLarga };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "La descripción no puede exceder"
      );
    });

    it("debería rechazar capacidad fuera de rango", async () => {
      // Arrange
      const eventoInvalido = { ...eventoValido, capacidadMaxima: 1001 };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "La capacidad máxima es"
      );
    });

    it("debería rechazar tipo de evento inválido", async () => {
      // Arrange
      const eventoInvalido = { ...eventoValido, tipo: "tipo-inexistente" };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "Tipo de evento inválido"
      );
    });

    it("debería rechazar fecha de inicio en el pasado", async () => {
      // Arrange
      const fechaPasada = "2020-01-01";
      const eventoInvalido = {
        ...eventoValido,
        fechaInicio: fechaPasada,
        fechaFin: fechaPasada,
        expositores: [
          // Expositor en la fecha correcta para evitar error de rango
          {
            ...eventoValido.expositores[0],
            dia: fechaPasada,
          },
        ],
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "La fecha de inicio debe ser igual o posterior a hoy"
      );
    });

    it("debería rechazar fecha fin anterior a fecha inicio", async () => {
      // Arrange
      const eventoInvalido = {
        ...eventoValido,
        fechaInicio: "2025-12-20",
        fechaFin: "2025-12-19", // Anterior a fecha inicio
        expositores: [
          // Expositor en rango válido
          {
            ...eventoValido.expositores[0],
            dia: "2025-12-19",
          },
        ],
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "La fecha de fin debe ser igual o posterior a la fecha de inicio"
      );
    });

    it("debería rechazar evento con duración excesiva", async () => {
      // Arrange
      const eventoMuyLargo = {
        ...eventoValido,
        fechaInicio: "2025-12-20",
        fechaFin: "2027-01-20", // Más de 365 días
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoMuyLargo)).rejects.toThrow(
        "El evento no puede durar más de"
      );
    });

    it("debería rechazar hora fin anterior a hora inicio en el mismo día", async () => {
      // Arrange
      const eventoInvalido = {
        ...eventoValido,
        fechaInicio: "2025-12-20",
        fechaFin: "2025-12-20", // Mismo día
        horaInicio: "17:00",
        horaFin: "09:00",
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "La hora de fin debe ser posterior a la hora de inicio"
      );
    });

    it("debería rechazar evento sin expositores", async () => {
      // Arrange
      const eventoInvalido = { ...eventoValido, expositores: [] };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "Debe agregar al menos un expositor"
      );
    });

    it("debería rechazar expositor fuera del rango de fechas del evento", async () => {
      // Arrange
      const expositorFueraDeRango = {
        ...eventoValido.expositores[0],
        dia: "2025-12-25", // Fuera del rango del evento
      };
      const eventoInvalido = {
        ...eventoValido,
        expositores: [expositorFueraDeRango],
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "Todos los expositores deben estar dentro del rango de fechas del evento"
      );
    });

    it("debería rechazar expositores con horarios solapados", async () => {
      // Arrange
      const expositor1 = {
        nombre: "Dr. Juan",
        correo: "juan@upao.edu.pe",
        tema: "Tema 1",
        dia: "2025-12-20",
        hora: "10:00",
        duracion: 120,
        break: false,
      };

      const expositor2 = {
        nombre: "Dra. María",
        correo: "maria@upao.edu.pe",
        tema: "Tema 2",
        dia: "2025-12-20",
        hora: "11:00", // Se solapa con expositor1 (10:00-12:00)
        duracion: 60,
        break: false,
      };

      const eventoInvalido = {
        ...eventoValido,
        expositores: [expositor1, expositor2],
      };

      // Act & Assert
      await expect(eventoSchema.validate(eventoInvalido)).rejects.toThrow(
        "Los horarios de Dr. Juan y Dra. María se solapan"
      );
    });
  });

  describe("validateEvento function", () => {
    const datosValidos = {
      titulo: "Evento Test",
      descripcion: "Descripción del evento de prueba",
      ubicacion: "Aula Test",
      capacidadMaxima: 50,
      tipo: "taller",
      estado: "borrador",
      fechaInicio: "2025-12-25",
      fechaFin: "2025-12-25",
      horaInicio: "10:00",
      horaFin: "16:00",
      expositores: [
        {
          nombre: "Test Expositor",
          correo: "test@upao.edu.pe",
          tema: "Test Topic",
          dia: "2025-12-25",
          hora: "11:00",
          duracion: 60,
          break: false,
        },
      ],
    };

    it("debería retornar isValid=true para datos válidos", async () => {
      // Act
      const resultado = await validateEvento(datosValidos);

      // Assert
      expect(resultado.isValid).toBe(true);
      expect(resultado.errors).toBeNull();
      expect(resultado.data).toBeTruthy();
    });

    it("debería retornar errores para datos inválidos", async () => {
      // Arrange
      const datosInvalidos = { titulo: "A" }; // Título muy corto

      // Act
      const resultado = await validateEvento(datosInvalidos);

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.errors).toBeTruthy();
      expect(resultado.errors.titulo).toContain(
        "El título debe tener al menos"
      );
      expect(resultado.data).toBeNull();
    });

    it("debería funcionar con mode update=true", async () => {
      // Arrange
      const datosParcialesValidos = { titulo: "Nuevo Título del Evento" };

      // Act
      const resultado = await validateEvento(datosParcialesValidos, true);

      // Assert
      expect(resultado.isValid).toBe(true);
      expect(resultado.data.titulo).toBe("Nuevo Título del Evento");
    });
  });

  describe("validateExpositor function", () => {
    const expositorValido = {
      nombre: "Dr. Test",
      correo: "test@upao.edu.pe",
      tema: "Tema de prueba",
      dia: "2024-12-25",
      hora: "14:00",
      duracion: 45,
      break: true,
    };

    it("debería validar expositor válido", async () => {
      // Act
      const resultado = await validateExpositor(expositorValido);

      // Assert
      expect(resultado.isValid).toBe(true);
      expect(resultado.errors).toBeNull();
      expect(resultado.data).toEqual(expositorValido);
    });

    it("debería retornar errores para expositor inválido", async () => {
      // Arrange
      const expositorInvalido = { nombre: "A" }; // Nombre muy corto

      // Act
      const resultado = await validateExpositor(expositorInvalido);

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.errors).toBeTruthy();
      expect(resultado.errors.nombre).toContain(
        "El nombre debe tener al menos"
      );
    });
  });

  describe("validateSync function", () => {
    it("debería validar sincrónicamente", () => {
      // Arrange
      const datosValidos = {
        nombre: "Dr. Sync Test",
        correo: "sync@upao.edu.pe",
        tema: "Validación Síncrona",
        dia: "2024-12-25",
        hora: "15:00",
        duracion: 30,
        break: false,
      };

      // Act
      const resultado = validateSync(datosValidos, expositorSchema);

      // Assert
      expect(resultado.isValid).toBe(true);
      expect(resultado.errors).toBeNull();
    });

    it("debería retornar errores sincrónicamente", () => {
      // Arrange
      const datosInvalidos = { nombre: "" };

      // Act
      const resultado = validateSync(datosInvalidos, expositorSchema);

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.errors).toBeTruthy();
    });
  });
});
