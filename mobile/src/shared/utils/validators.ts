/**
 * Client-side validation utilities.
 * Each function returns an error message string or null if valid.
 */

export const validateEmail = (value: string): string | null => {
  if (!value.trim()) {
    return 'El correo electrónico es requerido';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return 'Ingresa un correo electrónico válido';
  }
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) {
    return 'La contraseña es requerida';
  }
  if (value.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
};

export const validatePasswordConfirm = (
  password: string,
  confirm: string,
): string | null => {
  if (!confirm) {
    return 'Confirma tu contraseña';
  }
  if (password !== confirm) {
    return 'Las contraseñas no coinciden';
  }
  return null;
};

export const validatePhoneNumber = (value: string): string | null => {
  if (!value.trim()) {
    return 'El número de teléfono es requerido';
  }

  // Backend expects a valid international E.164 number.
  const normalized = value.replace(/[\s\-()]/g, '');
  const phoneRegex = /^\+[1-9]\d{10,14}$/;

  if (!phoneRegex.test(normalized)) {
    return 'Ingresa un número en formato internacional válido (ej: +51987654321)';
  }

  return null;
};

export const validateName = (
  value: string,
  fieldName = 'El nombre',
): string | null => {
  if (!value.trim()) {
    return `${fieldName} es requerido`;
  }
  if (value.trim().length < 3) {
    return `${fieldName} debe tener al menos 3 caracteres`;
  }
  if (value.trim().length > 100) {
    return `${fieldName} no puede superar 100 caracteres`;
  }
  return null;
};

export const validateRequired = (
  value: string,
  fieldName = 'Este campo',
): string | null => {
  if (!value.trim()) {
    return `${fieldName} es requerido`;
  }
  return null;
};

export const validatePositiveNumber = (
  value: string | number,
  fieldName = 'El valor',
): string | null => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num) || num <= 0) {
    return `${fieldName} debe ser un número positivo`;
  }
  return null;
};
