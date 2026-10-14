export function validateStudentHalaqahRule(
  studentClassId: string,
  halaqah: { class_id: string; is_active: boolean } | null
): { valid: boolean; error?: string } {
  if (!halaqah) {
    return { valid: false, error: 'Halaqah yang dipilih tidak ditemukan.' }
  }
  if (!halaqah.is_active) {
    return { valid: false, error: 'Tidak dapat memilih halaqah yang nonaktif.' }
  }
  if (halaqah.class_id !== studentClassId) {
    return { valid: false, error: 'Kelas santri harus sama dengan class_id halaqah.' }
  }
  return { valid: true }
}
