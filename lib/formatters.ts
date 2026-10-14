export interface SelectOption {
  value: string;
  label: string;
}

export function optionLabel(
  options: SelectOption[],
  value: string | null | undefined,
  placeholder: string
): string {
  if (!value) return placeholder;
  const match = options.find((opt) => opt.value === value);
  return match ? match.label : placeholder;
}

export function getGenderOptions(): SelectOption[] {
  return [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
  ];
}

export function getStatusOptions(): SelectOption[] {
  return [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
    { value: 'GRADUATED', label: 'Lulus' },
  ];
}

export function formatGender(gender: string | null | undefined): string {
  return optionLabel(getGenderOptions(), gender, '-');
}

export function resolveHalaqahOnClassChange(
  newClassId: string,
  currentHalaqahId: string,
  halaqahs: { id: string; class_id: string }[]
): string {
  const existsInNewClass = halaqahs.some(
    (h) => h.id === currentHalaqahId && h.class_id === newClassId
  );
  return existsInNewClass ? currentHalaqahId : '';
}

export function withUstadzTitle(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  // Matches "Ust." with optional space, or words like ust, ustad, ustadz, ustadzah, ustaz, ustazah followed by space or dot or end
  const titleRegex = /^(?:ust\.|(?:ust|ustad|ustadz|ustadzah|ustaz|ustazah)(?:\.|\s|$))/i;
  if (titleRegex.test(trimmed)) {
    return trimmed;
  }
  return `Ust. ${trimmed}`;
}

export function buildHalaqahLabel(halaqahName: string, teacherName: string | null | undefined): string {
  const formattedTeacher = withUstadzTitle(teacherName);
  if (!formattedTeacher) {
    return halaqahName;
  }
  return `${halaqahName} (${formattedTeacher})`;
}
