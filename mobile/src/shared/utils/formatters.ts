/**
 * Funciones utilitarias para formateo
 */

export const formatPhoneNumber = (phone: string): string => {
  // Formato: +57 300 123 4567
  if (phone.startsWith('+57')) {
    const digits = phone.substring(3);
    return `+57 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }
  return phone;
};

export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
