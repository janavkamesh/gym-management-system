export function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>, setPhone: (val: string) => void) {
  const val = e.target.value.replace(/\D/g, '');
  if (val.length <= 10) {
    setPhone(val);
  }
}

export function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone);
}
