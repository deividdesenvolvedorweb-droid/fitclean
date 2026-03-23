export function formatWhatsAppLink(phone: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("55")) digits = "55" + digits;
  if (digits.length < 12) return null;
  return `https://wa.me/${digits}`;
}
