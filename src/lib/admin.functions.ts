import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const ADMIN_PASSWORDS = ['880723', 'pzy5565283', 'boomer2016'];

export const verifyAdminPassword = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ password: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }) => ({ ok: ADMIN_PASSWORDS.includes(data.password) }));

export const adminDeletePost = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        password: z.string().min(1).max(64),
        postId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!ADMIN_PASSWORDS.includes(data.password)) {
      throw new Error('Unauthorized');
    }
    const { error } = await supabaseAdmin
      .from('community_posts')
      .delete()
      .eq('id', data.postId);
    if (error) throw error;
    return { ok: true };
  });
