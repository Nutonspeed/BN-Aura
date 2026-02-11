// Thai locale formatting utilities
// Dates use Buddhist calendar (BE = Gregorian + 543)
// Currency uses Thai Baht with proper formatting

export const formatThaiDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH-u-ca-buddhist', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatThaiDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('th-TH-u-ca-buddhist', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatThaiCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(num);
};

export const formatThaiNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('th-TH');
};
