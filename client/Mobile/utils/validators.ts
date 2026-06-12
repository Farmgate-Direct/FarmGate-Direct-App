export const isValidPhone = (phone: string) => {
  return /^09\d{9}$/.test(phone);
};

export const isGmail = (email: string) => {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
};