import { describe, it, expect, vi } from 'vitest';
import { ProjectMembersService } from './ProjectMembersService';
import { supabase } from './supabaseClient';

describe('ProjectMembersService & Supabase Project Members', () => {
  it('handles empty response gracefully when unauthenticated or unconfigured', async () => {
    if (supabase) {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any);
    }

    const members = await ProjectMembersService.fetchProjectMembers('demo-3d-app');
    expect(Array.isArray(members)).toBe(true);
  });

  it('rejects adding member if profile does not exist', async () => {
    if (supabase) {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any);
    }

    await expect(
      ProjectMembersService.addProjectMember('demo-3d-app', 'nonexistent_user_99999@test.com', 'developer')
    ).rejects.toThrow();
  });
});
