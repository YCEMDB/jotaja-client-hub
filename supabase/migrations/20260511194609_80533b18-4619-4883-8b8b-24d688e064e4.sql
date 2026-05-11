INSERT INTO public.user_roles (user_id, role)
SELECT '93a8ab6b-93cf-4865-aa24-77695d6c40a6'::uuid, 'super_admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = '93a8ab6b-93cf-4865-aa24-77695d6c40a6' AND role = 'super_admin'
);