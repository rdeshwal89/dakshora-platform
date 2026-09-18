import { FastifyReply, FastifyRequest } from "fastify";
import { supabase } from "../lib/supabase.js";

export function requirePermission(permissionName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.id) {
      return reply.code(401).send({
        success: false,
        error: "Authentication required"
      });
    }

    // Platform SuperAdmin has universal bypass for all permissions
    if (request.user.isSuperAdmin || request.user.role === "superadmin") {
      return;
    }

    const { data: membership, error: membershipError } =
      await supabase
        .from("organization_members")
        .select("role_id")
        .eq("user_id", request.user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) {
      return reply.code(500).send({
        success: false,
        error: membershipError.message
      });
    }

    if (!membership) {
      return reply.code(403).send({
        success: false,
        error: "Organization membership not found"
      });
    }

    const { data: rolePermission, error: permissionError } =
      await supabase
        .from("role_permissions")
        .select(`
          permission_id,
          permissions (
            name
          )
        `)
        .eq("role_id", membership.role_id);

    if (permissionError) {
      return reply.code(500).send({
        success: false,
        error: permissionError.message
      });
    }

    const hasPermission = rolePermission?.some((item) => {
      const permission = item.permissions as
        | { name: string }
        | { name: string }[]
        | null;

      if (Array.isArray(permission)) {
        return permission.some(
          (p) => p.name === permissionName
        );
      }

      return permission?.name === permissionName;
    });

    if (!hasPermission) {
      return reply.code(403).send({
        success: false,
        error: "Permission denied",
        required_permission: permissionName
      });
    }

    return;
  };
}