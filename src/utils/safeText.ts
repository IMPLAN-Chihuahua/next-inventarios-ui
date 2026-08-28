const DISALLOWED_SAFE_TEXT_CHARACTERS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,;:()#/_'’"¿?¡!%&+°-]/g;

export const sanitizeSafeText = (value: string) =>
  value.replace(DISALLOWED_SAFE_TEXT_CHARACTERS, "");

export const SAFE_TEXT_HELPER =
  "Usa letras, números y signos comunes como - / . , # ( )";
