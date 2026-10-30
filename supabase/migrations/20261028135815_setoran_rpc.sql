-- Migration: setoran_rpc
-- Description: RPC functions for submitting and voiding memorization records

BEGIN;

-- 1. public.submit_setoran
CREATE OR REPLACE FUNCTION public.submit_setoran(
  p_student_id uuid,
  p_date date,
  p_attendance public.attendance_status,
  p_type public.memorization_type DEFAULT null,
  p_juz smallint DEFAULT null,
  p_surah_id smallint DEFAULT null,
  p_ayah_start smallint DEFAULT null,
  p_ayah_end smallint DEFAULT null,
  p_line_count smallint DEFAULT null,
  p_mistake_count smallint DEFAULT 0,
  p_notes text DEFAULT null
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY INVOKER 
SET search_path = '' 
AS $$
DECLARE
  v_uid uuid;
  v_record_id uuid;
  v_fluency_score smallint;
  v_today date;
  v_ayah_count smallint;
  v_student_active boolean;
  v_active_exists boolean;
  v_conflict_exists boolean;
BEGIN
  -- Get current user session
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid' USING ERRCODE = 'TH000';
  END IF;

  -- Validate date (max today in Jakarta)
  v_today := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  IF p_date > v_today THEN
    RAISE EXCEPTION 'Tanggal di masa depan' USING ERRCODE = 'TH001';
  END IF;

  -- Check if student exists and is active
  SELECT (status = 'ACTIVE') INTO v_student_active
  FROM public.students
  WHERE id = p_student_id;

  IF v_student_active IS NULL OR NOT v_student_active THEN
    RAISE EXCEPTION 'Santri tidak ditemukan atau tidak aktif' USING ERRCODE = 'TH007';
  END IF;

  -- Validate for HADIR/TERLAMBAT
  IF p_attendance IN ('HADIR', 'TERLAMBAT') THEN
    IF p_type IS NULL OR p_juz IS NULL OR p_surah_id IS NULL OR p_ayah_start IS NULL OR p_ayah_end IS NULL OR p_line_count IS NULL THEN
      RAISE EXCEPTION 'Data setoran wajib diisi' USING ERRCODE = 'TH002';
    END IF;

    IF p_line_count < 1 OR p_line_count > 300 THEN
      RAISE EXCEPTION 'Jumlah baris tidak valid' USING ERRCODE = 'TH002';
    END IF;

    IF p_mistake_count < 0 OR p_mistake_count > 50 OR (p_notes IS NOT NULL AND length(p_notes) > 500) THEN
      RAISE EXCEPTION 'Data setoran di luar batas validasi' USING ERRCODE = '23514';
    END IF;

    -- Validate ayah against quran_surahs ayah_count
    SELECT ayah_count INTO v_ayah_count
    FROM public.quran_surahs
    WHERE id = p_surah_id;

    IF v_ayah_count IS NULL OR p_ayah_start < 1 OR p_ayah_end < p_ayah_start OR p_ayah_end > v_ayah_count THEN
      RAISE EXCEPTION 'Ayat melebihi jumlah ayat surat' USING ERRCODE = 'TH003';
    END IF;

    -- Check overlap for SABAQ with advisory lock to prevent race conditions
    IF p_type = 'SABAQ' THEN
      PERFORM pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));
      
      SELECT EXISTS (
        SELECT 1 FROM public.memorization_records
        WHERE student_id = p_student_id
          AND type = 'SABAQ'
          AND surah_id = p_surah_id
          AND status = 'ACTIVE'
          AND ayah_start <= p_ayah_end
          AND ayah_end >= p_ayah_start
      ) INTO v_conflict_exists;
      
      IF v_conflict_exists THEN
        RAISE EXCEPTION 'Rentang ayat sudah pernah disetor' USING ERRCODE = 'TH006';
      END IF;
    END IF;

    v_fluency_score := greatest(100 - 5 * p_mistake_count, 0);

    -- Upsert attendance
    INSERT INTO public.attendance (student_id, date, status, recorded_by)
    VALUES (p_student_id, p_date, p_attendance, v_uid)
    ON CONFLICT (student_id, date) 
    DO UPDATE SET status = EXCLUDED.status, recorded_by = v_uid;

    -- Insert record
    INSERT INTO public.memorization_records (
      student_id, date, type, juz, surah_id, ayah_start, ayah_end, 
      line_count, mistake_count, fluency_score, notes, recorded_by, status
    ) VALUES (
      p_student_id, p_date, p_type, p_juz, p_surah_id, p_ayah_start, p_ayah_end,
      p_line_count, p_mistake_count, v_fluency_score, p_notes, v_uid, 'ACTIVE'
    ) RETURNING id INTO v_record_id;

    RETURN v_record_id;

  ELSE
    -- IZIN, SAKIT, ALPHA
    SELECT EXISTS (
      SELECT 1 FROM public.memorization_records
      WHERE student_id = p_student_id AND date = p_date AND status = 'ACTIVE'
    ) INTO v_active_exists;

    IF v_active_exists THEN
      RAISE EXCEPTION 'Masih ada setoran aktif' USING ERRCODE = 'TH004';
    END IF;

    -- Upsert attendance only
    INSERT INTO public.attendance (student_id, date, status, recorded_by)
    VALUES (p_student_id, p_date, p_attendance, v_uid)
    ON CONFLICT (student_id, date) 
    DO UPDATE SET status = EXCLUDED.status, recorded_by = v_uid;

    RETURN NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.submit_setoran(uuid, date, public.attendance_status, public.memorization_type, smallint, smallint, smallint, smallint, smallint, smallint, text) 
IS 'Mencatat presensi santri dan setoran hafalan (SABAQ/SABQI/MANZIL) dengan validasi lengkap dan penanganan irisan sabaq.';


-- 2. public.void_setoran
CREATE OR REPLACE FUNCTION public.void_setoran(
  p_record_id uuid,
  p_reason text
) RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER 
SET search_path = '' 
AS $$
DECLARE
  v_uid uuid;
  v_affected_rows int;
  v_trimmed_reason text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid' USING ERRCODE = 'TH000';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'Alasan void wajib diisi' USING ERRCODE = '23514';
  END IF;

  v_trimmed_reason := trim(p_reason);
  IF length(v_trimmed_reason) < 3 OR length(v_trimmed_reason) > 200 THEN
    RAISE EXCEPTION 'Alasan harus 3-200 karakter' USING ERRCODE = '23514';
  END IF;

  UPDATE public.memorization_records
  SET 
    status = 'VOID',
    notes = trim(coalesce(notes, '') || ' [VOID: ' || v_trimmed_reason || ']')
  WHERE id = p_record_id AND status = 'ACTIVE';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  IF v_affected_rows = 0 THEN
    RAISE EXCEPTION 'Record tidak ditemukan atau sudah void' USING ERRCODE = 'TH005';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.void_setoran(uuid, text) 
IS 'Membatalkan (void) record setoran hafalan aktif dengan menyertakan alasan pembatalan.';


-- Permissions
REVOKE ALL ON FUNCTION public.submit_setoran(uuid, date, public.attendance_status, public.memorization_type, smallint, smallint, smallint, smallint, smallint, smallint, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_setoran(uuid, date, public.attendance_status, public.memorization_type, smallint, smallint, smallint, smallint, smallint, smallint, text) TO authenticated;

REVOKE ALL ON FUNCTION public.void_setoran(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.void_setoran(uuid, text) TO authenticated;

COMMIT;
