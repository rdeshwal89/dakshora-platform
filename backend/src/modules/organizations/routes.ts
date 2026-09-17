import { FastifyInstance } from "fastify";
import { supabase } from "../../lib/supabase.js";
import { requireAuth } from "../../middleware/auth.js";
export async function organizationRoutes(app: FastifyInstance) {
  app.get("/api/organizations", { preHandler: requireAuth }, async (request, reply) => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*");

    if (error) {
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }

    return {
      success: true,
      organizations: data,
    };
  });
}