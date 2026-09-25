export const formatINR = (amount: number | null | undefined) => {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactINR = (amount: number | null | undefined) => {
  if (amount == null) return '';
  if (amount < 1000) return `₹${amount}`;
  if (amount < 100000) {
    const k = amount / 1000;
    return `₹${k % 1 !== 0 ? k.toFixed(1).replace(/\.0$/, '') : k}K`;
  }
  if (amount < 10000000) {
    const l = amount / 100000;
    return `₹${l % 1 !== 0 ? l.toFixed(1).replace(/\.0$/, '') : l}L`;
  }
  const cr = amount / 10000000;
  return `₹${cr % 1 !== 0 ? cr.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1') : cr}Cr`;
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
};
