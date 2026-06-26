-- Remove o trigger automático de criação de profile
-- Vamos criar o profile manualmente na Server Action para ter controle total
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
