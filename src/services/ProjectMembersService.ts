import { supabase } from './supabaseClient';

export interface ProjectMemberDetail {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export class ProjectMembersService {
  /**
   * Fetch all members for a project joined with profile details
   */
  static async fetchProjectMembers(projectId: string): Promise<ProjectMemberDetail[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        id,
        project_id,
        user_id,
        role,
        created_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching project members from Supabase:', error);
      throw error;
    }

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.id,
      projectId: item.project_id,
      userId: item.user_id,
      role: item.role as 'owner' | 'admin' | 'developer' | 'viewer',
      createdAt: item.created_at,
      username: item.profiles?.username || 'user',
      displayName: item.profiles?.display_name || item.profiles?.username || 'Collaborator',
      avatarUrl: item.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    }));
  }

  /**
   * Add a new member to a project by looking up their username/email profile
   */
  static async addProjectMember(
    projectId: string,
    emailOrUsername: string,
    role: 'owner' | 'admin' | 'developer' | 'viewer'
  ): Promise<ProjectMemberDetail> {
    if (!supabase) throw new Error('Supabase client uninitialized');

    // 1. Lookup profile by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('username', emailOrUsername.split('@')[0])
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(`User "${emailOrUsername}" not found in profiles`);
    }

    // 2. Insert into project_members
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: profile.id,
        role
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding project member:', error);
      throw error;
    }

    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      role: data.role,
      createdAt: data.created_at,
      username: profile.username,
      displayName: profile.display_name || profile.username,
      avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    };
  }

  /**
   * Update an existing member's role
   */
  static async updateMemberRole(
    memberId: string,
    newRole: 'owner' | 'admin' | 'developer' | 'viewer'
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase client uninitialized');

    const { error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role in Supabase:', error);
      throw error;
    }
  }

  /**
   * Remove a member from the project
   */
  static async removeMember(memberId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client uninitialized');

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing project member from Supabase:', error);
      throw error;
    }
  }
}
