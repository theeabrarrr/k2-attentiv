-- Assign admin role to the first user (existing user without a role)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ORDER BY created_at ASC
LIMIT 1;