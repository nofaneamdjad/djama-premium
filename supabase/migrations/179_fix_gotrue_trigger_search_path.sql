-- Migration 179: Corriger search_path de link_user_access_on_signup
-- Cause: supabase_auth_admin a search_path=auth uniquement.
-- Sans qualification explicite, UPDATE user_access echoue dans le contexte GoTrue.
CREATE OR REPLACE FUNCTION public.link_user_access_on_signup()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, extensions
AS $$
BEGIN
  UPDATE public.user_access
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;
