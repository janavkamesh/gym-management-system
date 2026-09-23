export const cleanPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10 ? `91${cleaned}` : cleaned;
};

export const generateWhatsAppLink = (m: any) => {
  const message = `Hi ${m.name}, your Gym membership expires on ${new Date(m.expiry_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}. Renew now to keep your access active without interruption.`;
  return `https://wa.me/${cleanPhone(m.phone)}?text=${encodeURIComponent(message)}`;
};
