// Normalisasi nomor WhatsApp: terima 08..., 628..., +628... dan format ke 08...
export function normalizeWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('628')) {
    return '0' + cleaned.slice(2)
  }
  if (cleaned.startsWith('8')) {
    return '0' + cleaned
  }
  return cleaned
}

export function validateNisn(nisn: string): boolean {
  return /^\d{10}$/.test(nisn.trim())
}
