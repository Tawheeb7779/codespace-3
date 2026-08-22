-- CodeSpace 3D — Production Supabase Schema & RBAC RLS Policies

-- 1. Create Custom RBAC Enum
CREATE TYPE app_role AS ENUM ('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER');

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'DEVELOPER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 4. Workspace Snapshots Table
CREATE TABLE IF NOT EXISTS public.workspace_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_project ON public.workspace_snapshots(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_snapshots ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check User Project Role
CREATE OR REPLACE FUNCTION public.get_user_role(p_project_id UUID, p_user_id UUID)
RETURNS app_role AS $$
  SELECT role FROM public.project_members
  WHERE project_id = p_project_id AND user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for Projects Table
CREATE POLICY "Projects select policy" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Projects insert policy" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Projects update policy" ON public.projects
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    public.get_user_role(id, auth.uid()) IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "Projects delete policy" ON public.projects
  FOR DELETE USING (
    owner_id = auth.uid() OR
    public.get_user_role(id, auth.uid()) = 'OWNER'
  );

-- RLS Policies for Workspace Snapshots Table (No Viewers writing)
CREATE POLICY "Snapshots select policy" ON public.workspace_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = workspace_snapshots.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Snapshots insert policy" ON public.workspace_snapshots
  FOR INSERT WITH CHECK (
    public.get_user_role(project_id, auth.uid()) IN ('OWNER', 'ADMIN', 'DEVELOPER')
  );
