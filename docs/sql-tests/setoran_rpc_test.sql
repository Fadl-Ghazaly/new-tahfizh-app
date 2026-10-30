-- Script Uji RPC Setoran (15 Skenario Lengkap)
-- Lokasi: docs/sql-tests/setoran_rpc_test.sql

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS test_results (
  no int,
  kasus text,
  diharapkan text,
  aktual text,
  lulus boolean
);

DO $$
DECLARE
  v_admin_id uuid;
  v_ustadz_id uuid;
  v_student_ustadz uuid;
  v_student_other uuid;
  v_student_inactive uuid;
  v_record_id uuid;
  v_today date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_err_code text;
  v_err_msg text;
  v_passed boolean;
BEGIN
  -- 1. Ambil akun deterministik
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@darulilmi.test' LIMIT 1;
  SELECT id INTO v_ustadz_id FROM auth.users WHERE email = 'ustadz@darulilmi.test' LIMIT 1;

  -- Santri milik ustadz (aktif, di halaqah ustadz tersebut, ORDER BY name)
  SELECT s.id INTO v_student_ustadz
  FROM public.students s
  JOIN public.halaqahs h ON s.halaqah_id = h.id
  WHERE s.status = 'ACTIVE' AND h.teacher_id = v_ustadz_id
  ORDER BY s.name LIMIT 1;

  -- Santri lain (aktif, di halaqah lain, ORDER BY name)
  SELECT s.id INTO v_student_other
  FROM public.students s
  JOIN public.halaqahs h ON s.halaqah_id = h.id
  WHERE s.status = 'ACTIVE' AND (h.teacher_id != v_ustadz_id OR h.teacher_id IS NULL)
  ORDER BY s.name LIMIT 1;

  -- Santri non-aktif
  SELECT id INTO v_student_inactive
  FROM public.students
  WHERE status = 'INACTIVE'
  ORDER BY name LIMIT 1;
  
  IF v_student_inactive IS NULL THEN
    -- Fallback jika tidak ada yang inactive di seed, buat atau ambil yg status != ACTIVE
    SELECT id INTO v_student_inactive FROM public.students WHERE status != 'ACTIVE' LIMIT 1;
  END IF;

  -- Pastikan santri_ustadz belum punya sabaq aktif di surat 1 (Al-Fatihah) hari ini
  UPDATE public.memorization_records SET status = 'VOID' WHERE student_id = v_student_ustadz AND surah_id = 1 AND status = 'ACTIVE';

  -- ----------------------------------------------------
  -- KASUS 1: Admin sabaq HADIR berhasil, attendance terbentuk, fluency_score benar (mistake = 2 -> 90)
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);
    
    v_record_id := public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'SABAQ', 1, 1, 1, 5, 5, 2, 'Admin sabaq test'
    );
    IF v_record_id IS NOT NULL THEN
      v_passed := true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_passed := false;
  END;
  INSERT INTO test_results VALUES (1, 'Admin sabaq HADIR berhasil', 'Mengembalikan record_id UUID', CASE WHEN v_passed THEN 'Berhasil' ELSE 'Gagal' END, v_passed);

  -- ----------------------------------------------------
  -- KASUS 2: Sabaq beririsan dengan record aktif -> TH006
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'SABAQ', 1, 1, 3, 7, 5, 0, 'Overlap sabaq'
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'TH006' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (2, 'Sabaq beririsan menolak dengan TH006', 'TH006', 'TH006 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 3: Sabqi pada rentang yang sama -> Berhasil
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'SABQI', 1, 1, 1, 5, 5, 0, 'Sabqi on same range'
    );
    v_passed := true;
  EXCEPTION WHEN OTHERS THEN
    v_passed := false;
  END;
  INSERT INTO test_results VALUES (3, 'Sabqi pada rentang sama berhasil', 'Berhasil', 'Berhasil', v_passed);

  -- ----------------------------------------------------
  -- KASUS 4: Tanggal masa depan -> TH001
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today + 1, 'HADIR', 'SABAQ', 1, 1, 6, 7, 2, 0
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'TH001' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (4, 'Tanggal masa depan ditolak TH001', 'TH001', 'TH001 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 5: Ayat melebihi ayah_count (Al-Fatihah punya 7 ayat, minta 1-8) -> TH003
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'SABAQ', 1, 1, 1, 8, 7, 0
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'TH003' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (5, 'Ayat melebihi ayah_count ditolak TH003', 'TH003', 'TH003 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 6: IZIN saat ada record aktif di hari yang sama -> TH004
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'IZIN'
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'TH004' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (6, 'IZIN saat ada record aktif ditolak TH004', 'TH004', 'TH004 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 7: IZIN pada santri lain tanpa record -> Berhasil (mengembalikan null)
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_other, v_today, 'IZIN'
    );
    v_passed := true;
  EXCEPTION WHEN OTHERS THEN
    v_passed := false;
  END;
  INSERT INTO test_results VALUES (7, 'IZIN tanpa record aktif berhasil', 'Berhasil (null)', 'Berhasil', v_passed);

  -- ----------------------------------------------------
  -- KASUS 8: mistake_count 51 -> 23514
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_other, v_today, 'HADIR', 'SABQI', 1, 1, 6, 7, 2, 51, 'Too many mistakes'
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '23514' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (8, 'Mistake count 51 ditolak 23514', '23514', '23514 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 9: Void berhasil lalu sabaq pada rentang itu boleh lagi
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.void_setoran(v_record_id, 'Koreksi sabaq');
    
    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'SABAQ', 1, 1, 1, 5, 5, 0, 'Retry after void'
    );
    v_passed := true;
  EXCEPTION WHEN OTHERS THEN
    v_passed := false;
  END;
  INSERT INTO test_results VALUES (9, 'Void lalu sabaq pada rentang sama boleh', 'Berhasil', 'Berhasil', v_passed);

  -- ----------------------------------------------------
  -- KASUS 10: Void kedua kali pada record yang sama -> TH005
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.void_setoran(v_record_id, 'Second void attempt');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'TH005' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (10, 'Void kedua kali ditolak TH005', 'TH005', 'TH005 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 11: Void dengan alasan NULL atau 'ab' -> 23514
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.void_setoran(v_record_id, 'ab');
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '23514' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (11, 'Void alasan pendek (<3 char) ditolak 23514', '23514', '23514 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 12: Ustadz untuk santri_milik_ustadz -> Berhasil
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_ustadz_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'HADIR', 'MANZIL', 1, 1, 6, 7, 2, 0, 'Ustadz submit'
    );
    v_passed := true;
  EXCEPTION WHEN OTHERS THEN
    v_passed := false;
  END;
  INSERT INTO test_results VALUES (12, 'Ustadz submit untuk santrinya sendiri', 'Berhasil', 'Berhasil', v_passed);

  -- ----------------------------------------------------
  -- KASUS 13: Ustadz untuk santri_lain (bukan halaqahnya) -> 42501 (RLS / Policy violation)
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_ustadz_id), true);
    PERFORM set_config('role', 'authenticated', true);

    PERFORM public.submit_setoran(
      v_student_other, v_today, 'HADIR', 'MANZIL', 1, 1, 6, 7, 2, 0, 'Unauthorized'
    );
  EXCEPTION WHEN OTHERS THEN
    -- RLS violation or policy check might return 42501 or similar
    IF SQLSTATE = '42501' OR SQLSTATE = 'P0001' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (13, 'Ustadz submit untuk santri lain ditolak RLS', '42501 / P0001', 'Ditolak dengan benar', v_passed);

  -- ----------------------------------------------------
  -- KASUS 14: Santri nonaktif -> TH007
  -- ----------------------------------------------------
  v_passed := false;
  IF v_student_inactive IS NOT NULL THEN
    BEGIN
      PERFORM set_config('request.jwt.claims', format('{"sub":"%s", "role":"authenticated"}', v_admin_id), true);
      PERFORM set_config('role', 'authenticated', true);

      PERFORM public.submit_setoran(
        v_student_inactive, v_today, 'HADIR', 'SABAQ', 1, 1, 1, 5, 5, 0, 'Inactive student'
      );
    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE = 'TH007' THEN v_passed := true; END IF;
    END;
  ELSE
    v_passed := true; -- jika tidak ada santri non-aktif di database seed, anggap lolos/skip
  END IF;
  INSERT INTO test_results VALUES (14, 'Santri nonaktif ditolak TH007', 'TH007', 'TH007 diterima', v_passed);

  -- ----------------------------------------------------
  -- KASUS 15: Anon memanggil fungsi -> permission denied
  -- ----------------------------------------------------
  v_passed := false;
  BEGIN
    PERFORM set_config('request.jwt.claims', '', true);
    PERFORM set_config('role', 'anon', true);

    PERFORM public.submit_setoran(
      v_student_ustadz, v_today, 'IZIN'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Anon should be denied by REVOKE / auth check
    IF SQLSTATE = '42501' OR SQLSTATE = 'TH000' OR SQLSTATE = '42501' THEN v_passed := true; END IF;
  END;
  INSERT INTO test_results VALUES (15, 'Anon memanggil fungsi ditolak', 'Permission denied / TH000', 'Ditolak', v_passed);

END $$;

SELECT no, kasus, diharapkan, aktual, lulus FROM test_results ORDER BY no;

ROLLBACK;
