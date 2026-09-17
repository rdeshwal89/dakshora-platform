import { FastifyReply, FastifyRequest } from "fastify";
import { supabase } from "../lib/supabase.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      email?: string;
      phone?: string;
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

  request.user = {
    id: user.id,
    email: user.email,
    phone: user.phone
  };
}