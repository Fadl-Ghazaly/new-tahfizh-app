CREATE OR REPLACE FUNCTION get_public_school_settings()
RETURNS TABLE (
  school_name text,
  logo_url text,
  theme text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT school_name, logo_url, theme
  FROM public.school_settings
  LIMIT 1;
$$;

-- Cabut akses dari public secara default, berikan hanya kepada anon & authenticated
REVOKE ALL ON FUNCTION get_public_school_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_school_settings() TO anon, authenticated;
