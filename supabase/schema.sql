-- CodeSpace 3D - database schema and row level security policies.
--
-- Safe to re-run: every object is created with IF NOT EXISTS or OR REPLACE, and
-- policies are dropped before being recreated.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  template TEXT DEFAULT 'react-three',
  branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files are identified by their absolute path within a project, matching the
-- editor's filesystem model.
CREATE TABLE IF NOT EXISTS public.project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'plaintext',
  is_folder BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, path)
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON public.project_files (project_id);
CREATE INDEX IF NOT EXISTS project_members_project_id_idx ON public.project_members (project_id);
CREATE INDEX IF NOT EXISTS project_members_user_id_idx ON public.project_members (user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);

-- ---------------------------------------------------------------------------
-- Access helpers
--
-- These run as SECURITY DEFINER so a policy on `projects` can consult
-- `project_members` (and vice versa) without recursing into the other table's
-- policies - the usual cause of "infinite recursion detected in policy".
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.project_role(p_project_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.projects p WHERE p.id = p_project_id AND p.user_id = auth.uid())
      THEN 'owner'
    ELSE (
      SELECT m.role FROM public.project_members m
      WHERE m.project_id = p_project_id AND m.user_id = auth.uid()
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_read_project(p_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND (p.visibility = 'public' OR p.user_id = auth.uid())
  ) OR public.project_role(p_project_id) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.can_write_project(p_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.project_role(p_project_id) IN ('owner', 'admin', 'developer');
$$;

CREATE OR REPLACE FUNCTION public.can_administer_project(p_project_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.project_role(p_project_id) IN ('owner', 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Profiles ------------------------------------------------------------------

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- WITH CHECK is required as well as USING: without it a user could rewrite the
-- row's id and take over another profile.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Row level security cannot restrict individual columns, so plan and role are
-- pinned by a trigger. Otherwise any user could grant themselves 'admin'.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
    NEW.plan := OLD.plan;
    NEW.role := OLD.role;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileges ON public.profiles;
CREATE TRIGGER profiles_protect_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Projects ------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own projects or public projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR visibility = 'public' OR public.project_role(id) IS NOT NULL);

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- WITH CHECK keeps an editor from reassigning user_id to another account.
CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.can_administer_project(id))
  WITH CHECK (user_id = auth.uid() OR public.can_administer_project(id));

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Project files -------------------------------------------------------------

DROP POLICY IF EXISTS "Members and project viewers can read project files" ON public.project_files;
DROP POLICY IF EXISTS "Developers, admins, and owners can modify project files" ON public.project_files;
DROP POLICY IF EXISTS "project_files_select" ON public.project_files;
DROP POLICY IF EXISTS "project_files_insert" ON public.project_files;
DROP POLICY IF EXISTS "project_files_update" ON public.project_files;
DROP POLICY IF EXISTS "project_files_delete" ON public.project_files;

CREATE POLICY "project_files_select"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (public.can_read_project(project_id));

CREATE POLICY "project_files_insert"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (public.can_write_project(project_id));

CREATE POLICY "project_files_update"
  ON public.project_files FOR UPDATE
  TO authenticated
  USING (public.can_write_project(project_id))
  WITH CHECK (public.can_write_project(project_id));

CREATE POLICY "project_files_delete"
  ON public.project_files FOR DELETE
  TO authenticated
  USING (public.can_write_project(project_id));

-- Project members -----------------------------------------------------------
-- This table previously had row level security enabled with no policies, which
-- denied every read and silently broke all membership-based access checks.

DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_write" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete" ON public.project_members;

CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.can_read_project(project_id));

CREATE POLICY "project_members_write"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (public.can_administer_project(project_id));

CREATE POLICY "project_members_update"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (public.can_administer_project(project_id))
  WITH CHECK (public.can_administer_project(project_id));

CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (public.can_administer_project(project_id) OR user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Timestamps and signup trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_touch_updated_at ON public.projects;
CREATE TRIGGER projects_touch_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS project_files_touch_updated_at ON public.project_files;
CREATE TRIGGER project_files_touch_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, plan, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'free',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
