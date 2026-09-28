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

import crypto from "crypto";

export function verifyDakshoraToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "dakshora-enterprise-jwt-secret-2026";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payloadStr = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    const isSuperAdmin = payload.role === "superadmin" || payload.app_metadata?.role === "superadmin" || payload.isSuperAdmin === true;
    const role = isSuperAdmin ? "superadmin" : (payload.role || payload.app_metadata?.role || "school-admin");
    const organizationId = payload.organizationId || payload.app_metadata?.organization_id || "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";

    return {
      id: payload.sub || payload.id || "dakshora-user",
      email: payload.email,
      phone: payload.phone,
      name: payload.name || "Mobile User",
      role,
      isSuperAdmin,
      organizationId,
      permissions: isSuperAdmin ? ["*"] : (payload.permissions || ["websites.view", "websites.edit", "leads.view", "leads.manage", "school.manage", "ai.use"]),
      user_metadata: payload.user_metadata || {},
      app_metadata: payload.app_metadata || {}
    };
  } catch {
    return null;
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
    const dakshoraUser = verifyDakshoraToken(token);
    if (dakshoraUser) {
      request.user = dakshoraUser;
      return;
    }
    return reply.code(401).send({
      success: false,
      error: "Invalid or expired authentication token"
    });
  }

  const isSuperAdmin = user.app_metadata?.role === "superadmin";

  let role = isSuperAdmin
    ? "superadmin"
    : (user.app_metadata?.role as string);

  let organizationId = user.app_metadata?.organization_id as string | undefined;

  // If not superadmin and missing from app_metadata, securely resolve from organization_members
  if (!isSuperAdmin && (!organizationId || !role)) {
    try {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, roles(name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        organizationId = organizationId || membership.organization_id;
        if (!role && membership.roles) {
          const roleData = membership.roles as any;
          role = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
        }
      }
    } catch {
      // Fallback silently if DB query fails
    }
  }

  role = role || "school-admin";

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