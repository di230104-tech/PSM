-- Update is_admin function to check for system_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'system_admin' OR role = 'admin')
  );
END;
$function$
;

-- Update assets select policies to use system_admin
DROP POLICY IF EXISTS "Allow Admin/IT Staff to read all assets" ON public.assets;
CREATE POLICY "Allow Admin/IT Staff to read all assets"
  ON public.assets
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('system_admin', 'admin', 'it_staff')
  );

-- Update loans policies to use system_admin consistently
DROP POLICY IF EXISTS "Allow authenticated users to read loans" ON public.loans;
CREATE POLICY "Allow authenticated users to read loans"
  ON public.loans
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('system_admin', 'admin', 'it_staff')
    OR
    (employee_id = (SELECT id FROM public.employees WHERE email = auth.email()))
  );

DROP POLICY IF EXISTS "Allow admin/it_staff to manage loans" ON public.loans;
CREATE POLICY "Allow admin/it_staff to manage loans"
  ON public.loans
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('system_admin', 'admin', 'it_staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('system_admin', 'admin', 'it_staff')
  );
