import { FastifyInstance } from "fastify";
import { supabase } from "../../lib/supabase.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const body = request.body as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return reply.code(400).send({
        success: false,
        error: "Email and password are required"
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (error) {
      return reply.code(401).send({
        success: false,
        error: error.message
      });
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  });
}