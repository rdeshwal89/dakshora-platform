import { FastifyReply, FastifyRequest } from "fastify";
import { supabase } from "../lib/supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      email?: string;
      phone?: string;
      name?: string;
      role?: string;
      isSuperAdmin?: boolean;
      organizationId?: string;
      permissions?: string[];
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
    };
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send({
      success: false,
      error: "Missing authentication token"
    });
  }

  const token = authorization.substring(7);

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.code(401).send({
      success: false,
      error: "Invalid or expired authentication token"
    });
  }

  const isSuperAdmin = user.app_metadata?.role === "superadmin";

  const role = isSuperAdmin
    ? "superadmin"
    : (user.app_metadata?.role as string) || "school-admin";

  const organizationId =
    (user.app_metadata?.organization_id as string) ||
    (user.user_metadata?.organizationId as string) ||
    (user.user_metadata?.organization_id as string);

  request.user = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: (user.user_metadata?.name as string) || user.email,
    role,
    isSuperAdmin,
    organizationId,
    permissions: isSuperAdmin ? ["*"] : [],
    user_metadata: user.user_metadata as Record<string, unknown>,
    app_metadata: user.app_metadata as Record<string, unknown>
  };
}