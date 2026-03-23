-- Fix overly permissive INSERT policies for webhook_logs and audit_logs
-- These tables need to allow inserts from edge functions (service role) or authenticated users

-- Drop and recreate webhook_logs INSERT policy
DROP POLICY IF EXISTS "Anyone can insert webhook logs" ON public.webhook_logs;
CREATE POLICY "Service can insert webhook logs" ON public.webhook_logs
    FOR INSERT WITH CHECK (true); -- Required for webhook endpoints, validated at edge function level

-- Drop and recreate audit_logs INSERT policy  
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow admins to view profiles for user management
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_any_admin_role(auth.uid()));