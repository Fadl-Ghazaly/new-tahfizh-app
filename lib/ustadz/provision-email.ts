export const DEFAULT_USTADZ_PASSWORD = 'password123';
export const USTADZ_EMAIL_DOMAIN = 'darulilmi.test';

/**
 * Menghasilkan slug email yang bersih dari nama ustadz/ustadzah.
 * Contoh:
 * - "Ust. Daniswara Perdana" -> "daniswara.perdana@darulilmi.test"
 * - "Ustadzah Calista Oktaviani" -> "calista.oktaviani@darulilmi.test"
 */
export function buildUstadzEmailFromName(
  rawName: string,
  usedEmails?: Set<string>
): string {
  const withoutTitle = rawName
    .replace(/^(ustadzah|ustadz|ust\.?)\s+/i, '')
    .trim();

  const baseSlug = withoutTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');

  const cleanSlug = baseSlug || 'ustadz';

  if (!usedEmails) {
    return `${cleanSlug}@${USTADZ_EMAIL_DOMAIN}`;
  }

  let candidate = `${cleanSlug}@${USTADZ_EMAIL_DOMAIN}`;
  let counter = 2;
  while (usedEmails.has(candidate.toLowerCase())) {
    candidate = `${cleanSlug}.${counter}@${USTADZ_EMAIL_DOMAIN}`;
    counter++;
  }
  usedEmails.add(candidate.toLowerCase());
  return candidate;
}

