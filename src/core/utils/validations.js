// Utilidades para validaciones
export const validations = {
  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar email de Gmail específicamente
  isValidGmail: (email) => {
    return email.endsWith('@gmail.com') && email.length > 10;
  },

  // Validar contraseña segura
  isStrongPassword: (password) => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  },

  // Obtener mensaje de error para contraseña
  getPasswordErrorMessage: (password) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una letra minúscula";
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "La contraseña debe contener al menos un símbolo (!@#$%^&*(),.?\":{}|<>)";
    }
    return null;
  },

  // Validar fecha futura
  isFutureDate: (date, time) => {
    const eventDateTime = new Date(`${date}T${time}`);
    return eventDateTime > new Date();
  },

  // Validar capacidad de evento
  isValidCapacity: (capacity) => {
    const num = parseInt(capacity);
    return num >= 1 && num <= 1000;
  },

  // Validar longitud de texto
  isValidTextLength: (text, min, max) => {
    return text.length >= min && text.length <= max;
  }
};

export default validations;