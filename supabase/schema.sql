-- CodeSpace 3D — Production Database Schema & Row Level Security (RLS) Policies

-- 1. Profiles Table
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

-- 2. Projects Table
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

-- 3. Project Files Table
CREATE TABLE IF NOT EXISTS public.project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'typescript',
  is_folder BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Members & RBAC Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 5. Workspace Snapshots Table (Vault Backups)
CREATE TABLE IF NOT EXISTS public.workspace_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_count INTEGER NOT NULL DEFAULT 0,
  hash TEXT NOT NULL,
  manifest_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_snapshots ENABLE ROW LEVEL SECURITY;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_project_id ON public.workspace_snapshots(project_id);

-- 7. RLS Policies: Profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 8. RLS Policies: Projects
CREATE POLICY "Users can view their own projects or public projects or member projects"
  ON public.projects FOR SELECT USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners and admins can update projects"
  ON public.projects FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete projects"
  ON public.projects FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- 9. RLS Policies: Project Members & RBAC
CREATE POLICY "Members can view project member lists"
  ON public.project_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id AND (
        user_id = auth.uid() OR
        visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners and admins can manage project members"
  ON public.project_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = projects.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- 10. RLS Policies: Project Files
CREATE POLICY "Members and project viewers can read project files"
  ON public.project_files FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_files.project_id AND (
        user_id = auth.uid() OR
        visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Developers, admins, and owners can modify project files"
  ON public.project_files FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_files.project_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
      )
    )
  );

-- 11. RLS Policies: Workspace Snapshots (Vault)
CREATE POLICY "Members can view workspace snapshots"
  ON public.workspace_snapshots FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = workspace_snapshots.project_id AND (
        user_id = auth.uid() OR
        visibility = 'public' OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = projects.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Developers, admins, and owners can create/delete workspace snapshots"
  ON public.workspace_snapshots FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = workspace_snapshots.project_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
      )
    )
  );

-- 12. Automatic Profile & Owner Member Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, plan, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    'free',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
