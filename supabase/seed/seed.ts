import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fakerID_ID as faker } from '@faker-js/faker';
import {
  BARIS_PER_JUZ,
  formatCapaian,
  hitungNilai,
} from '../../lib/tahfizh';
import {
  getNextSabaqChunk,
  getJuzStartPosition,
  getJuzSegments,
} from '../../lib/quran-juz';

// Load environment variables dari .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const FAKER_SEED = 144609;

interface ProfileLookup {
  adminId: string;
  ustadzId: string;
}

interface TeacherModel {
  id: string;
  profile_id: string | null;
  name: string;
  gender: 'L' | 'P';
  whatsapp: string;
  boarding_school: string;
  is_active: boolean;
}

interface ClassModel {
  id: string;
  level: number;
  name: string;
}

interface HalaqahModel {
  id: string;
  name: string;
  class_id: string;
  teacher_id: string;
  is_active: boolean;
}

interface StudentModel {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  class_id: string;
  halaqah_id: string;
  parent_name: string;
  parent_whatsapp: string;
  photo_url: string | null;
  status: 'ACTIVE';
}

interface AttendanceModel {
  id: string;
  student_id: string;
  date: string;
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPHA';
  notes: string | null;
  recorded_by: string;
}

interface MemorizationRecordModel {
  id: string;
  student_id: string;
  recorded_by: string;
  date: string;
  type: 'SABAQ' | 'SABQI' | 'MANZIL';
  juz: number;
  surah_id: number;
  ayah_start: number;
  ayah_end: number;
  line_count: number;
  mistake_count: number;
  fluency_score: number;
  notes: string | null;
  status: 'ACTIVE';
}

interface MemorizedPortion {
  juz: number;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  lineCount: number;
}

interface StudentState {
  student: StudentModel;
  speedCategory: 'very_slow' | 'slow' | 'moderate' | 'fast' | 'very_fast';
  isSlumping: boolean; // aktivitas menurun di bulan berjalan
  currentJuz: number;
  currentPos: { juz: number; surahId: number; nextAyah: number } | null;
  history: MemorizedPortion[];
  recentSabaq: MemorizedPortion[];
  totalSabaqLines: number;
  last30DaysSabaqLines: number;
}

const PESANTREN_LIST = [
  'Pondok Modern Darussalam Gontor',
  'Pondok Pesantren Sidogiri Pasuruan',
  'Pondok Pesantren Lirboyo Kediri',
  'Pondok Pesantren Tebuireng Jombang',
  'Pondok Pesantren Al-Amien Prenduan',
  'Pondok Pesantren Husnul Khotimah Kuningan',
  'Pondok Pesantren Darunnajah Jakarta',
  'Pondok Pesantren Al-Mukmin Ngruki',
  'Pondok Pesantren Krapyak Yogyakarta',
  'Pondok Pesantren Langitan Tuban',
];

const CATATAN_USTADZ = [
  'Alhamdulillah bacaan sangat lancar dan makhraj fasih.',
  'Perhatikan mad jaiz munfashil dan ghunnah pada nun bertasydid.',
  'Makhraj huruf ain dan ha perlu lebih ditekan.',
  'Alhamdulillah mutqin, lanjutkan hafalan ke surat berikutnya.',
  'Perhatikan waqaf dan ibtida di pertengahan ayat.',
  'Tingkatkan murojaah di asrama agar lebih mantap.',
  'Irama dan tajwid sangat baik, mumtaz.',
];

/**
 * Menghasilkan tanggal kerja (Senin s.d. Sabtu) selama 365 hari terakhir
 * dalam zona waktu Asia/Jakarta (WIB).
 */
function getWorkDaysLast365Days(): string[] {
  const dates: string[] = [];
  const now = new Date();

  // Acuan hari ini di WIB (UTC+7)
  const todayWIB = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const endEpoch = todayWIB.getTime();

  for (let i = 365; i >= 0; i--) {
    const d = new Date(endEpoch - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getUTCDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    if (dayOfWeek !== 0) {
      // Hanya hari Senin sampai Sabtu
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  return dates;
}

/**
 * Menghasilkan nomor telepon berawalan 08xxxxxxxxxx
 */
function generateIndonesianPhone(): string {
  const prefix = faker.helpers.arrayElement(['0812', '0813', '0821', '0822', '0852', '0853', '0878', '0896']);
  const digits = faker.string.numeric(8);
  return `${prefix}${digits}`;
}

/**
 * Pembangkitan seluruh data di memori secara deterministik
 */
export function generateSeedData(profileLookup: ProfileLookup) {
  faker.seed(FAKER_SEED);

  // 1. BANGKITKAN 20 TEACHERS
  const teachers: TeacherModel[] = [];
  for (let i = 0; i < 20; i++) {
    const gender: 'L' | 'P' = i < 14 ? 'L' : 'P';
    const firstName = gender === 'L' ? faker.person.firstName('male') : faker.person.firstName('female');
    const lastName = faker.person.lastName();
    const title = gender === 'L' ? 'Ust. ' : 'Ustadzah ';
    const name = `${title}${firstName} ${lastName}`;

    teachers.push({
      id: faker.string.uuid(),
      profile_id: i === 0 ? profileLookup.ustadzId : null,
      name,
      gender,
      whatsapp: generateIndonesianPhone(),
      boarding_school: faker.helpers.arrayElement(PESANTREN_LIST),
      is_active: true,
    });
  }

  // 2. KELAS (level 7–12)
  const classes: ClassModel[] = [
    { id: faker.string.uuid(), level: 7, name: 'Kelas 7' },
    { id: faker.string.uuid(), level: 8, name: 'Kelas 8' },
    { id: faker.string.uuid(), level: 9, name: 'Kelas 9' },
    { id: faker.string.uuid(), level: 10, name: 'Kelas 10' },
    { id: faker.string.uuid(), level: 11, name: 'Kelas 11' },
    { id: faker.string.uuid(), level: 12, name: 'Kelas 12' },
  ];

  // 3. BANGKITKAN 12 HALAQAHS (2 per kelas, 12 guru berbeda)
  const halaqahs: HalaqahModel[] = [];
  let teacherIndex = 0;

  for (const cls of classes) {
    for (const suffix of ['A', 'B']) {
      halaqahs.push({
        id: faker.string.uuid(),
        name: `Halaqah ${cls.level}${suffix}`,
        class_id: cls.id,
        teacher_id: teachers[teacherIndex % teachers.length].id,
        is_active: true,
      });
      teacherIndex++;
    }
  }

  // 4. BANGKITKAN 100 STUDENTS
  const students: StudentModel[] = [];
  const usedNisns = new Set<string>();

  for (let i = 0; i < 100; i++) {
    // Sebaran kelas merata (sekitar 16-17 per kelas)
    const cls = classes[i % classes.length];
    const classHalaqahs = halaqahs.filter((h) => h.class_id === cls.id);
    const halaqah = classHalaqahs[i % classHalaqahs.length];

    const gender: 'L' | 'P' = i % 2 === 0 ? 'L' : 'P';
    const firstName = gender === 'L' ? faker.person.firstName('male') : faker.person.firstName('female');
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    let nisn = '';
    do {
      nisn = '00' + faker.string.numeric(8);
    } while (usedNisns.has(nisn));
    usedNisns.add(nisn);

    students.push({
      id: faker.string.uuid(),
      nisn,
      name,
      gender,
      class_id: cls.id,
      halaqah_id: halaqah.id,
      parent_name: `${faker.person.firstName('male')} ${faker.person.lastName()}`,
      parent_whatsapp: generateIndonesianPhone(),
      photo_url: null,
      status: 'ACTIVE',
    });
  }

  // 5. ATUR PROFIL KECEPATAN SETIAP SANTRI
  // Target variasi sabaq 1 tahun:
  // ~10 santri 1-2 juz, ~30 santri 3-6 juz, ~30 santri 7-12 juz, ~20 santri 13-20 juz, ~10 santri 21-25 juz
  const studentStates: StudentState[] = students.map((student, idx) => {
    let speedCategory: StudentState['speedCategory'];
    if (idx < 10) {
      speedCategory = 'very_slow'; // ~1-2 juz
    } else if (idx < 40) {
      speedCategory = 'slow'; // ~3-6 juz
    } else if (idx < 70) {
      speedCategory = 'moderate'; // ~7-12 juz
    } else if (idx < 90) {
      speedCategory = 'fast'; // ~13-20 juz
    } else {
      speedCategory = 'very_fast'; // ~21-25 juz
    }

    // 5 santri dijadikan "slumping" (aktivitas menurun di bulan berjalan untuk uji dashboard)
    const isSlumping = idx >= 15 && idx < 20;

    return {
      student,
      speedCategory,
      isSlumping,
      currentJuz: 30, // Mulai dari Juz 30
      currentPos: getJuzStartPosition(30),
      history: [],
      recentSabaq: [],
      totalSabaqLines: 0,
      last30DaysSabaqLines: 0,
    };
  });

  // 6. BANGKITKAN ATTENDANCE DAN MEMORIZATION RECORDS
  const dates = getWorkDaysLast365Days();
  const cutoffLast30Days = dates.length > 26 ? dates[dates.length - 26] : dates[0];

  const attendanceRecords: AttendanceModel[] = [];
  const memorizationRecords: MemorizationRecordModel[] = [];

  for (const date of dates) {
    const isRecentMonth = date >= cutoffLast30Days;

    for (const state of studentStates) {
      // Bobot kehadiran: HADIR ~86%, TERLAMBAT ~4%, IZIN ~4%, SAKIT ~3%, ALPHA ~3%
      let status: AttendanceModel['status'];
      const randAtt = faker.number.float({ min: 0, max: 100 });

      if (state.isSlumping && isRecentMonth) {
        // Santri yang sedang slump: kehadiran lebih sering izin/sakit/alpha
        if (randAtt < 40) status = 'HADIR';
        else if (randAtt < 50) status = 'TERLAMBAT';
        else if (randAtt < 70) status = 'IZIN';
        else if (randAtt < 85) status = 'SAKIT';
        else status = 'ALPHA';
      } else {
        if (randAtt < 86) status = 'HADIR';
        else if (randAtt < 90) status = 'TERLAMBAT';
        else if (randAtt < 94) status = 'IZIN';
        else if (randAtt < 97) status = 'SAKIT';
        else status = 'ALPHA';
      }

      const attId = faker.string.uuid();
      attendanceRecords.push({
        id: attId,
        student_id: state.student.id,
        date,
        status,
        notes: status !== 'HADIR' && status !== 'TERLAMBAT' ? `Keterangan: ${status}` : null,
        recorded_by: profileLookup.adminId,
      });

      // JIKA TIDAK HADIR (IZIN, SAKIT, ALPHA), JANGAN BUAT RECORD HAFALAN!
      if (status !== 'HADIR' && status !== 'TERLAMBAT') {
        continue;
      }

      // Tentukan target baris harian berdasarkan kategori kecepatan
      let targetDailyLines = 0;
      switch (state.speedCategory) {
        case 'very_slow':
          // 1-2 juz setahun -> target ~350-550 baris (min >= 300)
          targetDailyLines = faker.helpers.arrayElement([1, 2, 2, 3]);
          break;
        case 'slow':
          // 3-6 juz setahun -> target ~900-1800 baris
          targetDailyLines = faker.helpers.arrayElement([3, 4, 5, 6]);
          break;
        case 'moderate':
          // 7-12 juz setahun -> target ~2100-3600 baris
          targetDailyLines = faker.helpers.arrayElement([8, 10, 11, 13]);
          break;
        case 'fast':
          // 13-20 juz setahun -> target ~3900-6000 baris
          targetDailyLines = faker.helpers.arrayElement([15, 17, 19, 21]);
          break;
        case 'very_fast':
          // 21-25 juz setahun -> target ~6300-7500 baris (maksimal 7500 baris / 25 juz)
          targetDailyLines = faker.helpers.arrayElement([24, 25, 26, 27]);
          break;
      }

      // Jika sedang slump di bulan berjalan, setoran sabaq turun drastis (kadang 0)
      if (state.isSlumping && isRecentMonth) {
        targetDailyLines = faker.helpers.arrayElement([0, 1, 2]);
      }

      // BATAS MAKSIMUM: Total sabaq per santri TIDAK BOLEH melebihi 25 juz (7.500 baris)
      const MAX_SABAQ_LINES = 7500;
      if (state.totalSabaqLines >= MAX_SABAQ_LINES) {
        targetDailyLines = 0;
      } else if (state.totalSabaqLines + targetDailyLines > MAX_SABAQ_LINES) {
        targetDailyLines = MAX_SABAQ_LINES - state.totalSabaqLines;
      }

      // A. SETORAN SABAQ (Hafalan Baru)
      if (targetDailyLines > 0 && state.currentPos) {
        let linesRemainingToday = targetDailyLines;

        // Ambil potongan sabaq (bisa beberapa potongan jika melewati batas surah)
        while (linesRemainingToday > 0 && state.currentPos) {
          const chunk = getNextSabaqChunk(state.currentPos, linesRemainingToday);

          const mistakeCount = faker.helpers.weightedArrayElement([
            { weight: 65, value: 0 },
            { weight: 20, value: 1 },
            { weight: 8, value: 2 },
            { weight: 4, value: 3 },
            { weight: 2, value: 4 },
            { weight: 1, value: 5 },
          ]);
          const fluencyScore = hitungNilai(mistakeCount);

          const record: MemorizationRecordModel = {
            id: faker.string.uuid(),
            student_id: state.student.id,
            recorded_by: profileLookup.adminId,
            date,
            type: 'SABAQ',
            juz: chunk.juz,
            surah_id: chunk.surahId,
            ayah_start: chunk.ayahStart,
            ayah_end: chunk.ayahEnd,
            line_count: chunk.lineCount,
            mistake_count: mistakeCount,
            fluency_score: fluencyScore,
            notes: faker.number.float({ min: 0, max: 100 }) < 15 ? faker.helpers.arrayElement(CATATAN_USTADZ) : null,
            status: 'ACTIVE',
          };

          memorizationRecords.push(record);

          const portion: MemorizedPortion = {
            juz: chunk.juz,
            surahId: chunk.surahId,
            ayahStart: chunk.ayahStart,
            ayahEnd: chunk.ayahEnd,
            lineCount: chunk.lineCount,
          };

          state.history.push(portion);
          state.recentSabaq.push(portion);
          if (state.recentSabaq.length > 5) {
            state.recentSabaq.shift();
          }

          state.totalSabaqLines += chunk.lineCount;
          if (isRecentMonth) {
            state.last30DaysSabaqLines += chunk.lineCount;
          }

          linesRemainingToday -= chunk.lineCount;

          if (chunk.isJuzCompleted) {
            // Pindah ke juz berikutnya (mundur: 30 -> 29 -> 28 ... min juz 1)
            if (state.currentJuz > 1) {
              state.currentJuz--;
              state.currentPos = getJuzStartPosition(state.currentJuz);
            } else {
              // Sudah khatam 30 juz
              state.currentPos = null;
              break;
            }
          } else {
            state.currentPos = chunk.nextPosition;
          }
        }
      }

      // B. SETORAN SABQI (Murojaah Dekat 1-5 hari terakhir)
      if (state.recentSabaq.length > 0 && faker.number.float({ min: 0, max: 100 }) < 80) {
        const targetPortion = faker.helpers.arrayElement(state.recentSabaq);
        const mistakeCount = faker.helpers.weightedArrayElement([
          { weight: 75, value: 0 },
          { weight: 15, value: 1 },
          { weight: 7, value: 2 },
          { weight: 3, value: 3 },
        ]);

        memorizationRecords.push({
          id: faker.string.uuid(),
          student_id: state.student.id,
          recorded_by: profileLookup.adminId,
          date,
          type: 'SABQI',
          juz: targetPortion.juz,
          surah_id: targetPortion.surahId,
          ayah_start: targetPortion.ayahStart,
          ayah_end: targetPortion.ayahEnd,
          line_count: targetPortion.lineCount,
          mistake_count: mistakeCount,
          fluency_score: hitungNilai(mistakeCount),
          notes: null,
          status: 'ACTIVE',
        });
      }

      // C. SETORAN MANZIL (Murojaah Lama)
      if (state.history.length > 10 && faker.number.float({ min: 0, max: 100 }) < 70) {
        // Ambil bagian yang sudah pernah dihafal di masa lampau
        const targetPortion = faker.helpers.arrayElement(state.history.slice(0, Math.max(1, state.history.length - 5)));
        const mistakeCount = faker.helpers.weightedArrayElement([
          { weight: 70, value: 0 },
          { weight: 20, value: 1 },
          { weight: 8, value: 2 },
          { weight: 2, value: 3 },
        ]);

        memorizationRecords.push({
          id: faker.string.uuid(),
          student_id: state.student.id,
          recorded_by: profileLookup.adminId,
          date,
          type: 'MANZIL',
          juz: targetPortion.juz,
          surah_id: targetPortion.surahId,
          ayah_start: targetPortion.ayahStart,
          ayah_end: targetPortion.ayahEnd,
          line_count: targetPortion.lineCount,
          mistake_count: mistakeCount,
          fluency_score: hitungNilai(mistakeCount),
          notes: null,
          status: 'ACTIVE',
        });
      }
    }
  }

  return {
    teachers,
    classes,
    halaqahs,
    students,
    studentStates,
    attendanceRecords,
    memorizationRecords,
    dates,
  };
}

/**
 * Validasi seluruh constraint tabel di memori
 */
export function validateConstraintsInMemory(data: ReturnType<typeof generateSeedData>): {
  violations: string[];
} {
  const violations: string[] = [];

  // Validasi Teachers
  for (const t of data.teachers) {
    if (t.gender !== 'L' && t.gender !== 'P') {
      violations.push(`Teacher gender tidak valid: ${t.id}`);
    }
    if (!/^08\d{8,11}$/.test(t.whatsapp)) {
      violations.push(`Teacher whatsapp tidak sesuai format 08xxxxxxxxxx: ${t.whatsapp}`);
    }
    if (!t.name || t.name.trim().length === 0) {
      violations.push(`Teacher name kosong: ${t.id}`);
    }
  }

  // Validasi Students
  const nisnSet = new Set<string>();
  for (const s of data.students) {
    if (!/^\d{10}$/.test(s.nisn)) {
      violations.push(`Student NISN bukan 10 digit angka: ${s.nisn}`);
    }
    if (nisnSet.has(s.nisn)) {
      violations.push(`Student NISN duplikat: ${s.nisn}`);
    }
    nisnSet.add(s.nisn);

    if (s.gender !== 'L' && s.gender !== 'P') {
      violations.push(`Student gender tidak valid: ${s.id}`);
    }
    if (!/^08\d{8,11}$/.test(s.parent_whatsapp)) {
      violations.push(`Student parent_whatsapp tidak sesuai: ${s.parent_whatsapp}`);
    }
    if (s.status !== 'ACTIVE') {
      violations.push(`Student status bukan ACTIVE: ${s.status}`);
    }
  }

  // Peta attendance per student dan date
  const attendanceMap = new Map<string, string>();
  for (const att of data.attendanceRecords) {
    const key = `${att.student_id}_${att.date}`;
    if (attendanceMap.has(key)) {
      violations.push(`Attendance duplikat untuk student dan tanggal: ${key}`);
    }
    attendanceMap.set(key, att.status);

    if (!['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'].includes(att.status)) {
      violations.push(`Attendance status tidak valid: ${att.status}`);
    }
  }

  // Validasi Memorization Records
  for (const r of data.memorizationRecords) {
    if (r.line_count < 1 || r.line_count > 300) {
      violations.push(`Line count di luar batas [1, 300]: ${r.line_count}`);
    }
    if (r.ayah_end < r.ayah_start) {
      violations.push(`ayah_end < ayah_start: ${r.ayah_start}-${r.ayah_end}`);
    }
    if (r.ayah_start < 1) {
      violations.push(`ayah_start < 1: ${r.ayah_start}`);
    }
    if (r.surah_id < 1 || r.surah_id > 114) {
      violations.push(`surah_id di luar batas [1, 114]: ${r.surah_id}`);
    }
    if (r.juz < 1 || r.juz > 30) {
      violations.push(`juz di luar batas [1, 30]: ${r.juz}`);
    }
    if (r.fluency_score < 0 || r.fluency_score > 100) {
      violations.push(`fluency_score di luar batas [0, 100]: ${r.fluency_score}`);
    }
    if (r.mistake_count < 0) {
      violations.push(`mistake_count < 0: ${r.mistake_count}`);
    }
    if (!['SABAQ', 'SABQI', 'MANZIL'].includes(r.type)) {
      violations.push(`type hafalan tidak valid: ${r.type}`);
    }

    // Pastikan juz konsisten dengan surat dan ayat
    const juzSegs = getJuzSegments(r.juz);
    const segMatch = juzSegs.find(
      (seg) => seg.surahId === r.surah_id && r.ayah_start >= seg.ayahStart && r.ayah_end <= seg.ayahEnd
    );
    if (!segMatch) {
      violations.push(
        `Juz ${r.juz} tidak konsisten dengan surah ${r.surah_id} ayat ${r.ayah_start}-${r.ayah_end}`
      );
    }

    // Pastikan TIDAK ADA record hafalan di hari yang tidak hadir
    const attStatus = attendanceMap.get(`${r.student_id}_${r.date}`);
    if (!attStatus || (attStatus !== 'HADIR' && attStatus !== 'TERLAMBAT')) {
      violations.push(
        `Record hafalan ditemukan pada tanggal berstatus ${attStatus ?? 'TANPA_ABSENSI'}: santri ${r.student_id}, tgl ${r.date}`
      );
    }
  }

  // Pastikan batas sabaq per santri antara 1 juz (300 baris) dan 25 juz (7.500 baris)
  for (const s of data.studentStates) {
    if (s.totalSabaqLines > 7500) {
      violations.push(`Santri ${s.student.name} melebihi batas 25 juz (7500 baris): ${s.totalSabaqLines} baris`);
    }
    if (s.totalSabaqLines < 300) {
      violations.push(`Santri ${s.student.name} di bawah batas minimum 1 juz (300 baris): ${s.totalSabaqLines} baris`);
    }
  }

  return { violations };
}

/**
 * Mencetak statistik lengkap mode --dry-run
 */
function printDryRunStatistics(data: ReturnType<typeof generateSeedData>) {
  const { violations } = validateConstraintsInMemory(data);

  console.log('\n======================================================');
  console.log('       SEED DATA GENERATION REPORT (MODE: DRY-RUN)     ');
  console.log('======================================================');
  console.log(`Faker Seed Digunakan       : ${FAKER_SEED}`);
  console.log(`Status Penulisan DB        : TIDAK MENULIS KE DATABASE (Aman)`);
  console.log(`Validasi Constraint Memori : ${violations.length === 0 ? 'LULUS (0 Pelanggaran)' : `GAGAL (${violations.length} Pelanggaran)`}`);

  if (violations.length > 0) {
    console.error('\nPelanggaran Constraint Terdeteksi:');
    violations.slice(0, 10).forEach((v) => console.error(` - ${v}`));
    if (violations.length > 10) {
      console.error(` ...dan ${violations.length - 10} pelanggaran lainnya.`);
    }
  }

  console.log('\n--- 1. JUMLAH BARIS PER TABEL ---');
  console.log(`• teachers               : ${data.teachers.length} baris`);
  console.log(`• halaqahs               : ${data.halaqahs.length} baris`);
  console.log(`• students               : ${data.students.length} baris`);
  console.log(`• attendance             : ${data.attendanceRecords.length} baris`);
  console.log(`• memorization_records   : ${data.memorizationRecords.length} baris`);
  const totalRows =
    data.teachers.length +
    data.halaqahs.length +
    data.students.length +
    data.attendanceRecords.length +
    data.memorizationRecords.length;
  console.log(`• TOTAL SELURUH DATA     : ${totalRows} baris`);

  // Estimasi waktu insert (chunk 1000 baris ~ 150ms per batch via service role)
  const estSeconds = Math.round((totalRows / 1000) * 0.4 + 2);
  console.log(`• Estimasi Waktu Insert  : ±${estSeconds} - ${estSeconds + 5} detik`);

  console.log('\n--- 2. RENTANG WAKTU (365 HARI KERJA) ---');
  console.log(`• Tanggal Awal           : ${data.dates[0]}`);
  console.log(`• Tanggal Akhir          : ${data.dates[data.dates.length - 1]}`);
  console.log(`• Total Hari Kerja       : ${data.dates.length} hari (Senin s.d. Sabtu)`);

  console.log('\n--- 3. JUMLAH ATTENDANCE PER STATUS ---');
  const attCounts: Record<string, number> = {};
  for (const a of data.attendanceRecords) {
    attCounts[a.status] = (attCounts[a.status] || 0) + 1;
  }
  const totalAtt = data.attendanceRecords.length;
  Object.entries(attCounts).forEach(([st, cnt]) => {
    const pct = ((cnt / totalAtt) * 100).toFixed(1);
    console.log(`• ${st.padEnd(10)}: ${cnt.toString().padStart(6)} baris (${pct}%)`);
  });

  console.log('\n--- 4. JUMLAH RECORD PER TYPE HAFALAN ---');
  const typeCounts: Record<string, number> = {};
  for (const m of data.memorizationRecords) {
    typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  }
  const totalRec = data.memorizationRecords.length;
  Object.entries(typeCounts).forEach(([tp, cnt]) => {
    const pct = ((cnt / totalRec) * 100).toFixed(1);
    console.log(`• ${tp.padEnd(10)}: ${cnt.toString().padStart(6)} baris (${pct}%)`);
  });

  console.log('\n--- 5. STATISTIK TOTAL SABAQ PER SANTRI ---');
  const sabaqTotals = data.studentStates.map((s) => s.totalSabaqLines).sort((a, b) => a - b);
  const minSabaq = sabaqTotals[0];
  const maxSabaq = sabaqTotals[sabaqTotals.length - 1];
  const medianSabaq =
    sabaqTotals.length % 2 === 0
      ? Math.round((sabaqTotals[sabaqTotals.length / 2 - 1] + sabaqTotals[sabaqTotals.length / 2]) / 2)
      : sabaqTotals[Math.floor(sabaqTotals.length / 2)];

  console.log(`• Total Sabaq Minimum    : ${minSabaq} baris (${formatCapaian(minSabaq)}) [>= 300 baris: ${minSabaq >= 300 ? 'LULUS' : 'GAGAL'}]`);
  console.log(`• Total Sabaq Median     : ${medianSabaq} baris (${formatCapaian(medianSabaq)})`);
  console.log(`• Total Sabaq Maksimum   : ${maxSabaq} baris (${formatCapaian(maxSabaq)}) [<= 7500 baris: ${maxSabaq <= 7500 ? 'LULUS' : 'GAGAL'}]`);

  console.log('\n--- 6. PROFIL KECEPATAN (TARGET PEMBANGKITAN) ---');
  const speedProfiles = [
    { label: '1 - 2 juz (very_slow)', target: 10, actual: 0 },
    { label: '3 - 6 juz (slow)', target: 30, actual: 0 },
    { label: '7 - 12 juz (moderate)', target: 30, actual: 0 },
    { label: '13 - 20 juz (fast)', target: 20, actual: 0 },
    { label: '21 - 25 juz (very_fast)', target: 10, actual: 0 },
  ];

  for (const s of data.studentStates) {
    if (s.speedCategory === 'very_slow') speedProfiles[0].actual++;
    else if (s.speedCategory === 'slow') speedProfiles[1].actual++;
    else if (s.speedCategory === 'moderate') speedProfiles[2].actual++;
    else if (s.speedCategory === 'fast') speedProfiles[3].actual++;
    else if (s.speedCategory === 'very_fast') speedProfiles[4].actual++;
  }

  for (const p of speedProfiles) {
    console.log(
      `• Kelompok ${p.label.padEnd(25)}: ${p.actual.toString().padStart(3)} santri (target: ~${p.target})`
    );
  }

  console.log('\n--- 7. DISTRIBUSI DASHBOARD (FLOOR(TOTAL_BARIS / 300)) ---');
  const dashboardGroups = {
    '0 - 1 juz': 0,
    '2 - 5 juz': 0,
    '6 - 10 juz': 0,
    '11 - 20 juz': 0,
    '21 - 30 juz': 0,
  };

  for (const s of data.studentStates) {
    const juzEarned = Math.floor(s.totalSabaqLines / BARIS_PER_JUZ);
    if (juzEarned <= 1) dashboardGroups['0 - 1 juz']++;
    else if (juzEarned <= 5) dashboardGroups['2 - 5 juz']++;
    else if (juzEarned <= 10) dashboardGroups['6 - 10 juz']++;
    else if (juzEarned <= 20) dashboardGroups['11 - 20 juz']++;
    else dashboardGroups['21 - 30 juz']++;
  }

  let totalDashboard = 0;
  Object.entries(dashboardGroups).forEach(([grp, cnt]) => {
    totalDashboard += cnt;
    console.log(`• Kelompok ${grp.padEnd(12)}: ${cnt.toString().padStart(3)} santri`);
  });
  console.log(`• Total Santri        : ${totalDashboard.toString().padStart(3)} santri`);

  console.log('\n--- 8. RENTANG NOMOR SURAT PER JUZ YANG TERSENTUH ---');
  const juzSurahRanges = new Map<number, { minSurah: number; maxSurah: number; count: number }>();
  for (const r of data.memorizationRecords) {
    const existing = juzSurahRanges.get(r.juz);
    if (!existing) {
      juzSurahRanges.set(r.juz, { minSurah: r.surah_id, maxSurah: r.surah_id, count: 1 });
    } else {
      existing.minSurah = Math.min(existing.minSurah, r.surah_id);
      existing.maxSurah = Math.max(existing.maxSurah, r.surah_id);
      existing.count++;
    }
  }

  // Tampilkan urut dari Juz 30 ke juz terendah yang tersentuh
  const sortedJuzKeys = Array.from(juzSurahRanges.keys()).sort((a, b) => b - a);
  for (const j of sortedJuzKeys) {
    const info = juzSurahRanges.get(j)!;
    console.log(`• Juz ${j.toString().padStart(2)}: Surah ${info.minSurah.toString().padStart(3)} s.d. ${info.maxSurah.toString().padStart(3)} (${info.count.toString().padStart(5)} record)`);
  }

  console.log('\n--- 9. 5 SANTRI DENGAN TOTAL TERTINGGI ---');
  const sortedStudents = [...data.studentStates].sort(
    (a, b) => b.totalSabaqLines - a.totalSabaqLines
  );
  sortedStudents.slice(0, 5).forEach((s, idx) => {
    const h = data.halaqahs.find((hal) => hal.id === s.student.halaqah_id);
    console.log(
      ` ${idx + 1}. ${s.student.name.padEnd(25)} | ${h?.name ?? '-'} | ${formatCapaian(s.totalSabaqLines).padEnd(20)} (${s.totalSabaqLines} baris)`
    );
  });

  console.log('\n--- 10. SANTRI DENGAN AKTIVITAS MENURUN DI BULAN BERJALAN ---');
  const slumpingCount = data.studentStates.filter((s) => s.isSlumping).length;
  console.log(`• Jumlah santri "butuh perhatian": ${slumpingCount} santri (siap untuk uji filter dashboard)`);

  console.log('======================================================\n');
}

/**
 * Eksekusi seed ke database Supabase (--confirm)
 */
async function executeDatabaseSeed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Kredensial SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local');
  }

  // Tampilkan hanya ref URL (aman dari kebocoran kunci)
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  console.log(`Menghubungkan ke Supabase Project Ref: ${projectRef}...`);
  console.log('Kredensial SUPABASE_SERVICE_ROLE_KEY: [TERSEDIA]');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Ambil ID profil admin dan ustadz dari database
  const { data: adminProfiles, error: adminErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('role', 'ADMIN')
    .limit(1);

  if (adminErr || !adminProfiles || adminProfiles.length === 0) {
    throw new Error('Profil ADMIN tidak ditemukan di database. Pastikan migrasi awal sudah dijalankan.');
  }

  const { data: ustadzProfiles, error: ustadzErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('role', 'USTADZ')
    .limit(1);

  if (ustadzErr || !ustadzProfiles || ustadzProfiles.length === 0) {
    throw new Error('Profil USTADZ tidak ditemukan di database.');
  }

  const profileLookup: ProfileLookup = {
    adminId: adminProfiles[0].id,
    ustadzId: ustadzProfiles[0].id,
  };

  console.log('\nMembangkitkan data di memori...');
  const data = generateSeedData(profileLookup);

  console.log('\nMemverifikasi constraint di memori...');
  const { violations } = validateConstraintsInMemory(data);
  if (violations.length > 0) {
    throw new Error(`Gagal validasi constraint: ${violations[0]}`);
  }

  console.log('\n--- MENGHAPUS DATA LAMA SECARA BERTAHAP (FK RESTRICT SAFE) ---');
  // 1. memorization_records
  const { count: recCount } = await supabase.from('memorization_records').select('*', { count: 'exact', head: true });
  console.log(`Menghapus memorization_records (${recCount ?? 0} baris)...`);
  await supabase.from('memorization_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. attendance
  const { count: attCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
  console.log(`Menghapus attendance (${attCount ?? 0} baris)...`);
  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. students
  const { count: stuCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  console.log(`Menghapus students (${stuCount ?? 0} baris)...`);
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 4. halaqahs
  const { count: halCount } = await supabase.from('halaqahs').select('*', { count: 'exact', head: true });
  console.log(`Menghapus halaqahs (${halCount ?? 0} baris)...`);
  await supabase.from('halaqahs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 5. teachers
  const { count: tchCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
  console.log(`Menghapus teachers (${tchCount ?? 0} baris)...`);
  await supabase.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Helper chunk insert
  async function insertInChunks(
    table: string,
    items: readonly object[],
    chunkSize = 1000
  ) {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const query = supabase.from(table);
      const { error } = await (query.insert as unknown as (data: unknown) => Promise<{ error: { message: string } | null }>)(chunk);
      if (error) {
        throw new Error(`Gagal insert ke ${table} (chunk ${i}-${i + chunk.length}): ${error.message}`);
      }
      process.stdout.write(`\rMemasukkan ${table}: ${Math.min(i + chunkSize, items.length)} / ${items.length} baris...`);
    }
    console.log(` Selesai.`);
  }

  // Ambil class_id aktual dari database (level 7 s.d. 12)
  const { data: dbClasses } = await supabase.from('classes').select('id, level');
  if (!dbClasses || dbClasses.length === 0) {
    throw new Error('Tabel classes kosong di database.');
  }
  const classMap = new Map<number, string>();
  dbClasses.forEach((c) => classMap.set(c.level, c.id));

  // Sesuaikan class_id di halaqah dan student agar sesuai UUID DB
  for (const h of data.halaqahs) {
    const cls = data.classes.find((c) => c.id === h.class_id);
    if (cls && classMap.has(cls.level)) {
      h.class_id = classMap.get(cls.level)!;
    }
  }

  for (const s of data.students) {
    const cls = data.classes.find((c) => c.id === s.class_id);
    if (cls && classMap.has(cls.level)) {
      s.class_id = classMap.get(cls.level)!;
    }
  }

  console.log('\n--- MEMASUKKAN DATA DUMMY BARU ---');
  await insertInChunks('teachers', data.teachers);
  await insertInChunks('halaqahs', data.halaqahs);
  await insertInChunks('students', data.students);
  await insertInChunks('attendance', data.attendanceRecords, 2000);
  await insertInChunks('memorization_records', data.memorizationRecords, 2000);

  console.log('\n✓ SEEDING BERHASIL SELESAI!');
}

/**
 * Entrypoint CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--dry-run')) {
    // Mode dry run (hanya di memori)
    const mockProfileLookup: ProfileLookup = {
      adminId: '7d8027cf-de7c-47dc-9011-2e1ed3fa28d7',
      ustadzId: '2cdf6c41-c708-44cf-99d3-efbc1a60369d',
    };
    const data = generateSeedData(mockProfileLookup);
    printDryRunStatistics(data);
    return;
  }

  if (args.includes('--confirm')) {
    await executeDatabaseSeed();
    return;
  }

  console.log('\n=== TAHFIZH APP - DATABASE SEEDING UTILITY ===');
  console.log('Penggunaan:');
  console.log('  npm run seed -- --dry-run   : Menghitung & memvalidasi data dummy di memori (Aman, tanpa nulis DB)');
  console.log('  npm run seed -- --confirm   : Menghapus data lama dan mengisi data baru ke database');
  console.log('===============================================\n');
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
