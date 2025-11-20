/**
 * Tests para ExpositoresTable - Tabla de gestión de expositores
 * @fileoverview Tests unitarios para el componente de gestión de expositores
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExpositoresTable from "../../src/components/ExpositoresTable";
import { validateExpositor } from "../../src/core/validation/eventoValidation";

// Mock de validación
vi.mock("../../src/core/validation/eventoValidation", () => ({
  validateExpositor: vi.fn(),
}));

describe("ExpositoresTable", () => {
  const defaultProps = {
    expositores: [],
    setExpositores: vi.fn(),
    fechaInicio: "2025-06-15",
    fechaFin: "2025-06-17",
    horaInicio: "09:00",
    horaFin: "17:00",
    disabled: false,
  };

  const expositorEjemplo = {
    nombre: "Dr. Juan Pérez",
    correo: "juan.perez@upao.edu.pe",
    tema: "React y el futuro del desarrollo web",
    dia: "2025-06-15",
    hora: "10:00",
    duracion: 90,
    break: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado inicial", () => {
    it("debería renderizar el componente correctamente", () => {
      // Act
      render(<ExpositoresTable {...defaultProps} />);

      // Assert
      expect(screen.getByText(/Gestión de Expositores/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Día del evento/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Nombre completo/i)
      ).toBeInTheDocument();
    });

    it("debería generar días del evento correctamente", () => {
      // Act
      render(<ExpositoresTable {...defaultProps} />);

      // Assert
      const selectDia = screen.getByLabelText(/Día del evento/i);
      expect(selectDia).toBeInTheDocument();

      // Verificar que tiene las opciones correctas
      const opciones = screen.getAllByRole("option");
      expect(opciones).toHaveLength(3); // 15, 16, 17 de diciembre
      expect(opciones[0]).toHaveTextContent("2025-06-15");
      expect(opciones[1]).toHaveTextContent("2025-06-16");
      expect(opciones[2]).toHaveTextContent("2025-06-17");
    });

    it("debería seleccionar el primer día por defecto", () => {
      // Act
      render(<ExpositoresTable {...defaultProps} />);

      // Assert
      const selectDia = screen.getByLabelText(/Día del evento/i);
      expect(selectDia.value).toBe("2025-06-15");
    });

    it("debería establecer hora inicial por defecto", () => {
      // Act
      render(<ExpositoresTable {...defaultProps} />);

      // Assert
      const selectHora = screen.getByLabelText(/Hora de inicio/i);
      expect(selectHora.value).toBe("09:00");
    });
  });

  describe("Gestión de formulario", () => {
    it("debería permitir llenar todos los campos del formulario", async () => {
      // Arrange
      render(<ExpositoresTable {...defaultProps} />);

      // Act
      await typeInInput("Nombre completo", expositorEjemplo.nombre);
      await typeInInput("Correo electrónico", expositorEjemplo.correo);
      await typeInInput("Tema de la ponencia", expositorEjemplo.tema);

      const horaSelect = screen.getByLabelText(/Hora de inicio/i);
      fireEvent.change(horaSelect, { target: { value: "10:00" } });

      const duracionSelect = screen.getByLabelText(/Duración/i);
      fireEvent.change(duracionSelect, { target: { value: "90" } });

      // Assert
      expect(
        screen.getByDisplayValue(expositorEjemplo.nombre)
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(expositorEjemplo.correo)
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(expositorEjemplo.tema)
      ).toBeInTheDocument();
      expect(horaSelect.value).toBe("10:00");
      expect(duracionSelect.value).toBe("90");
    });

    it("debería limpiar errores al escribir en campos", async () => {
      // Arrange
      render(<ExpositoresTable {...defaultProps} />);

      // Simular que hay errores
      const nombreInput = screen.getByPlaceholderText(/Nombre completo/i);

      // Act
      await typeInInput("Nombre completo", "Nombre válido");

      // Assert - No debería mostrar errores después de escribir
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe("Validación y agregado de expositores", () => {
    it("debería agregar expositor válido exitosamente", async () => {
      // Arrange
      vi.mocked(validateExpositor).mockResolvedValue({
        isValid: true,
        errors: null,
        data: expositorEjemplo,
      });

      const mockSetExpositores = vi.fn();
      render(
        <ExpositoresTable
          {...defaultProps}
          setExpositores={mockSetExpositores}
        />
      );

      // Act - Llenar formulario
      await typeInInput("Nombre completo", expositorEjemplo.nombre);
      await typeInInput("Correo electrónico", expositorEjemplo.correo);
      await typeInInput("Tema de la ponencia", expositorEjemplo.tema);

      const horaSelect = screen.getByLabelText(/Hora de inicio/i);
      fireEvent.change(horaSelect, { target: { value: "10:00" } });

      const duracionSelect = screen.getByLabelText(/Duración/i);
      fireEvent.change(duracionSelect, { target: { value: "90" } });

      await clickButton("Agregar Expositor");

      // Assert
      await waitFor(() => {
        expect(validateExpositor).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: expositorEjemplo.nombre,
            correo: expositorEjemplo.correo,
            tema: expositorEjemplo.tema,
            dia: "2025-06-15",
            hora: "10:00",
            duracion: 90,
          })
        );
        expect(mockSetExpositores).toHaveBeenCalled();
      });
    });

    it("debería mostrar errores de validación", async () => {
      // Arrange
      vi.mocked(validateExpositor).mockResolvedValue({
        isValid: false,
        errors: {
          nombre: "El nombre es muy corto",
          correo: "Correo inválido",
        },
        data: null,
      });

      render(<ExpositoresTable {...defaultProps} />);

      // Act
      await typeInInput("Nombre completo", "A"); // Nombre muy corto
      await clickButton("Agregar Expositor");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("El nombre es muy corto")).toBeInTheDocument();
        expect(screen.getByText("Correo inválido")).toBeInTheDocument();
      });
    });

    it("debería limpiar formulario después de agregar exitosamente", async () => {
      // Arrange
      vi.mocked(validateExpositor).mockResolvedValue({
        isValid: true,
        errors: null,
        data: expositorEjemplo,
      });

      render(<ExpositoresTable {...defaultProps} />);

      // Act
      await typeInInput("Nombre completo", expositorEjemplo.nombre);
      await clickButton("Agregar Expositor");

      // Assert
      await waitFor(() => {
        const nombreInput = screen.getByPlaceholderText(/Nombre completo/i);
        expect(nombreInput.value).toBe("");
      });
    });
  });

  describe("Visualización de expositores existentes", () => {
    it("debería mostrar expositores del día seleccionado", () => {
      // Arrange
      const expositoresExistentes = [
        { ...expositorEjemplo, dia: "2025-06-15" },
        { ...expositorEjemplo, nombre: "Dra. María López", dia: "2025-06-16" },
      ];

      // Act
      render(
        <ExpositoresTable
          {...defaultProps}
          expositores={expositoresExistentes}
        />
      );

      // Assert
      // Debería mostrar solo el expositor del día seleccionado (15 de diciembre)
      expect(screen.getByText("Dr. Juan Pérez")).toBeInTheDocument();
      expect(screen.queryByText("Dra. María López")).not.toBeInTheDocument();
    });

    it("debería cambiar expositores mostrados al cambiar día", () => {
      // Arrange
      const expositoresExistentes = [
        { ...expositorEjemplo, dia: "2025-06-15" },
        { ...expositorEjemplo, nombre: "Dra. María López", dia: "2025-06-16" },
      ];

      render(
        <ExpositoresTable
          {...defaultProps}
          expositores={expositoresExistentes}
        />
      );

      // Act - Cambiar al día 16
      const selectDia = screen.getByLabelText(/Día del evento/i);
      fireEvent.change(selectDia, { target: { value: "2025-06-16" } });

      // Assert
      expect(screen.queryByText("Dr. Juan Pérez")).not.toBeInTheDocument();
      expect(screen.getByText("Dra. María López")).toBeInTheDocument();
    });

    it("debería ordenar expositores por hora", () => {
      // Arrange
      const expositoresDesordenados = [
        {
          ...expositorEjemplo,
          nombre: "Expositor 14:00",
          hora: "14:00",
          dia: "2025-06-15",
        },
        {
          ...expositorEjemplo,
          nombre: "Expositor 10:00",
          hora: "10:00",
          dia: "2025-06-15",
        },
        {
          ...expositorEjemplo,
          nombre: "Expositor 12:00",
          hora: "12:00",
          dia: "2025-06-15",
        },
      ];

      // Act
      render(
        <ExpositoresTable
          {...defaultProps}
          expositores={expositoresDesordenados}
        />
      );

      // Assert
      const filas = screen.getAllByRole("row");
      // Saltar la primera fila que es el header
      const filasDeExpositores = filas.slice(1);

      expect(filasDeExpositores[0]).toHaveTextContent("Expositor 10:00");
      expect(filasDeExpositores[1]).toHaveTextContent("Expositor 12:00");
      expect(filasDeExpositores[2]).toHaveTextContent("Expositor 14:00");
    });
  });

  describe("Eliminar expositores", () => {
    it("debería permitir eliminar un expositor", () => {
      // Arrange
      const mockSetExpositores = vi.fn();
      const expositoresExistentes = [expositorEjemplo];

      render(
        <ExpositoresTable
          {...defaultProps}
          expositores={expositoresExistentes}
          setExpositores={mockSetExpositores}
        />
      );

      // Act
      const botonEliminar = screen.getByRole("button", { name: /eliminar/i });
      fireEvent.click(botonEliminar);

      // Assert
      expect(mockSetExpositores).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("Estado deshabilitado", () => {
    it("debería deshabilitar todos los controles cuando disabled=true", () => {
      // Act
      render(<ExpositoresTable {...defaultProps} disabled={true} />);

      // Assert
      expect(screen.getByPlaceholderText(/Nombre completo/i)).toBeDisabled();
      expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeDisabled();
      expect(
        screen.getByPlaceholderText(/Tema de la ponencia/i)
      ).toBeDisabled();
      expect(screen.getByLabelText(/Hora de inicio/i)).toBeDisabled();
      expect(screen.getByLabelText(/Duración/i)).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /agregar expositor/i })
      ).toBeDisabled();
    });
  });

  describe("Generación de horas", () => {
    it("debería generar opciones de hora en intervalos de 30 minutos", () => {
      // Arrange
      const propsConHorasCortas = {
        ...defaultProps,
        horaInicio: "09:00",
        horaFin: "11:00",
      };

      // Act
      render(<ExpositoresTable {...propsConHorasCortas} />);

      // Assert
      const selectHora = screen.getByLabelText(/Hora de inicio/i);
      const opciones = selectHora.querySelectorAll("option");

      expect(opciones).toHaveLength(5); // 09:00, 09:30, 10:00, 10:30, 11:00
      expect(opciones[0].value).toBe("09:00");
      expect(opciones[1].value).toBe("09:30");
      expect(opciones[2].value).toBe("10:00");
      expect(opciones[3].value).toBe("10:30");
      expect(opciones[4].value).toBe("11:00");
    });
  });

  describe("PropTypes y validación", () => {
    it("debería funcionar con props por defecto", () => {
      // Act & Assert
      expect(() => {
        render(
          <ExpositoresTable
            setExpositores={vi.fn()}
            fechaInicio="2025-06-15"
            fechaFin="2025-06-15"
            horaInicio="09:00"
            horaFin="17:00"
          />
        );
      }).not.toThrow();
    });

    it("debería manejar fechas faltantes gracefully", () => {
      // Act & Assert
      expect(() => {
        render(
          <ExpositoresTable
            setExpositores={vi.fn()}
            fechaInicio=""
            fechaFin=""
            horaInicio="09:00"
            horaFin="17:00"
          />
        );
      }).not.toThrow();
    });
  });
});
