import { FastifyInstance } from 'fastify';
import { supabase } from '../../lib/supabase.js';
import { requireAuth } from '../../middleware/auth.js';

/**
 * Register CRUD endpoints for a lightweight teacher profile that extends the
 * shared `public.school_staff` table. The profile stores teacher-specific
 * optional data such as subject specialization, grade, bio, and a portrait URL.
 */
export async function registerTeacherProfileRoutes(app: FastifyInstance) {
  // Create / update a teacher profile (upsert)
  app.post('/api/teacher/profile', async (req, reply) => {
    console.log('[DEBUG] ENTERED POST /api/teacher/profile, body:', req.body);
    try {
      const body = (req.body || {}) as any;
      const { staff_id, subject_specialization, grade, profile_picture_url, bio } = body;

      if (!staff_id) {
        return reply.code(400).send({ success: false, error: 'staff_id is required' });
      }

      // Verify the staff record exists in public.staff
      const staff = await supabase
        .from('staff')
        .select('id, role, designation')
        .eq('id', staff_id)
        .single();

      if (staff.error || !staff.data) {
        return reply.code(404).send({ success: false, error: 'Staff record not found' });
      }

      const upsert = await supabase
        .from('teacher_profiles')
        .upsert({
          staff_id,
          subject_specialization,
          grade,
          profile_picture_url,
          bio,
        })
        .select()
        .single();

      if (upsert.error) {
        return reply.code(500).send({ success: false, error: upsert.error.message });
      }

      return reply.code(200).send({ success: true, profile: upsert.data });
    } catch (err: any) {
      req.log.error(err, 'Error in POST /api/teacher/profile');
      return reply.code(500).send({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // Retrieve a teacher profile by staff_id
  app.get('/api/teacher/profile/:staff_id', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const { staff_id } = req.params as any;
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('staff_id', staff_id)
        .single();

      if (error) {
        return reply.code(404).send({ success: false, error: 'Profile not found' });
      }

      return reply.code(200).send({ success: true, profile: data });
    } catch (err: any) {
      req.log.error(err, 'Error in GET /api/teacher/profile/:staff_id');
      return reply.code(500).send({ success: false, error: err.message || 'Internal server error' });
    }
  });
}
