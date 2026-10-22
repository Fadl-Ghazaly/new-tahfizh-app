export interface HalaqahRel {
  id: string;
  name: string;
  class_id: string;
  is_active: boolean;
  classes?: { name: string } | null;
}

export function normalizeHalaqahRelation(data: unknown): HalaqahRel[] {
  if (!data) return [];

  const rawList = Array.isArray(data) ? data : [data];
  const result: HalaqahRel[] = [];

  for (const item of rawList) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      'name' in item &&
      typeof item.name === 'string' &&
      'class_id' in item &&
      typeof item.class_id === 'string' &&
      'is_active' in item &&
      typeof item.is_active === 'boolean'
    ) {
      let classes: { name: string } | null = null;
      if (
        'classes' in item &&
        typeof item.classes === 'object' &&
        item.classes !== null &&
        'name' in item.classes &&
        typeof (item.classes as { name: unknown }).name === 'string'
      ) {
        classes = { name: (item.classes as { name: string }).name };
      }

      result.push({
        id: item.id,
        name: item.name,
        class_id: item.class_id,
        is_active: item.is_active,
        classes,
      });
    }
  }

  return result;
}

export function validateTeacherDeactivationRule(
  activeHalaqahs: { name?: string | null }[]
): { valid: boolean; error?: string } {
  const validNames = (activeHalaqahs || [])
    .map((h) => (h && typeof h.name === 'string' ? h.name.trim() : ''))
    .filter((n) => n.length > 0);

  if (validNames.length === 0) {
    return { valid: true };
  }

  let listStr = '';
  if (validNames.length === 1) {
    listStr = validNames[0];
  } else if (validNames.length === 2) {
    listStr = `${validNames[0]} dan ${validNames[1]}`;
  } else {
    const last = validNames[validNames.length - 1];
    const rest = validNames.slice(0, -1).join(', ');
    listStr = `${rest}, dan ${last}`;
  }

  return {
    valid: false,
    error: `Ustadz ini masih mengampu ${listStr}. Ganti ustadz pengampunya terlebih dahulu.`,
  };
}
