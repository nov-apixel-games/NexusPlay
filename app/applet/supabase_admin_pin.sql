-- 1. Añadir la columna de hash a site_settings (si no existe)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT;

-- 2. Asegurar que la extensión pgcrypto esté habilitada para encriptar
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Crear función para consultar si el PIN está configurado
CREATE OR REPLACE FUNCTION is_admin_pin_configured()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT admin_pin_hash INTO stored_hash FROM site_settings WHERE id = 1;
  RETURN stored_hash IS NOT NULL AND stored_hash != '';
END;
$$;

-- 4. Crear función para configurar, cambiar o eliminar el PIN
CREATE OR REPLACE FUNCTION set_admin_pin(new_pin TEXT, current_pin TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
  user_role TEXT;
BEGIN
  -- Obtener el rol del usuario actual
  SELECT role INTO user_role FROM users WHERE id = auth.uid();

  -- Validar que el usuario sea administrador
  IF NOT (auth.role() = 'authenticated' AND user_role = 'admin') THEN
    RAISE EXCEPTION 'No autorizado. Se requieren privilegios de administrador.';
  END IF;

  -- Obtener el hash almacenado
  SELECT admin_pin_hash INTO stored_hash FROM site_settings WHERE id = 1;

  -- Si ya hay un PIN y se intenta cambiar/eliminar, validar el PIN actual
  IF stored_hash IS NOT NULL AND stored_hash != '' THEN
    IF current_pin IS NULL OR crypt(current_pin, stored_hash) != stored_hash THEN
      RAISE EXCEPTION 'PIN actual incorrecto.';
    END IF;
  END IF;

  -- Si new_pin es nulo, eliminamos el PIN
  IF new_pin IS NULL THEN
    UPDATE site_settings SET admin_pin_hash = NULL WHERE id = 1;
  ELSE
    -- Encriptar y guardar el nuevo PIN
    UPDATE site_settings SET admin_pin_hash = crypt(new_pin, gen_salt('bf')) WHERE id = 1;
  END IF;

  RETURN TRUE;
END;
$$;

-- Nota: Estas funciones deben ser ejecutadas en el SQL Editor de Supabase.
