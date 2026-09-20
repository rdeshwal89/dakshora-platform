import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyExpress from "@fastify/express";
import { requirePermission } from "./middleware/permission.js";
import { organizationRoutes } from "./modules/organizations/routes.js";
import { supabase } from "./lib/supabase.js";
import { requireAuth } from "./middleware/auth.js";
import { authRoutes } from "./modules/auth/routes.js";
import { bootstrapSuperAdmin } from "./services/bootstrapSuperAdmin.js";
// @ts-ignore
import erpApp from "./erpApp.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    xContentTypeOptions: true,
    xFrameOptions: { action: "sameorigin" },
    xXssProtection: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });

  const allowedOrigins = [
    "https://dakshora.co.in",
    "https://www.dakshora.co.in",
    "https://dakshora.in",
    "https://www.dakshora.in",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".dakshora.co.in") ||
        origin.endsWith(".dakshora.in") ||
        origin === "https://dakshora.co.in" ||
        origin === "https://dakshora.in" ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        cb(null, true);
        return;
      }
      cb(new Error("CORS origin not allowed: " + origin), false);
    },
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-organization-id",
      "x-org-id"
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"]
  });

  await app.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute"
  });

  await app.register(fastifyExpress);
  app.use(erpApp);

  // Health check
  app.get("/health", async () => {
    return {
      success: true,
      service: "dakshora-api",
      status: "healthy",
      timestamp: new Date().toISOString()
    };
  });

  // Supabase health check
  app.get("/health/supabase", async (_request, reply) => {
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    if (error) {
      return reply.code(503).send({
        success: false,
        service: "supabase",
        status: "unhealthy",
        error: error.message
      });
    }

    return {
      success: true,
      service: "supabase",
      status: "connected"
    };
  });

  // Current authenticated user
  app.get(
    "/api/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      // Platform SuperAdmin handling: platform-level user does not require single-tenant restriction
      if (request.user.isSuperAdmin || request.user.role === "superadmin") {
        const { data: defaultOrg } = await supabase
          .from("organizations")
          .select("*")
          .eq("slug", "dakshora")
          .limit(1)
          .maybeSingle();

        return {
          success: true,
          user: request.user,
          organization: defaultOrg || {
            id: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e",
            name: "Dakshora Platform",
            slug: "dakshora",
            plan: "enterprise",
            status: "active"
          },
          role: {
            id: "superadmin",
            name: "super_admin",
            permissions: ["*"]
          }
        };
      }

      // Find user's organization membership
      const { data: membership, error: membershipError } =
        await supabase
          .from("organization_members")
          .select("organization_id, role_id")
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
          error: "User is not assigned to an organization"
        });
      }

      // Find organization
      const { data: organization, error: organizationError } =
        await supabase
          .from("organizations")
          .select("*")
          .eq("id", membership.organization_id)
          .single();

      if (organizationError) {
        return reply.code(500).send({
          success: false,
          error: organizationError.message
        });
      }

      // Find role
      const { data: role, error: roleError } =
        await supabase
          .from("roles")
          .select("*")
          .eq("id", membership.role_id)
          .single();

      if (roleError) {
        return reply.code(500).send({
          success: false,
          error: roleError.message
        });
      }

      return {
        success: true,
        user: request.user,
        organization,
        role
      };
    }
  );

  // Authentication routes
  await app.register(authRoutes);
  await app.register(organizationRoutes);
  // Authorization test
  app.get(
    "/api/admin/test",
    {
      preHandler: [
        requireAuth,
        requirePermission("platform.manage")
      ]
    },
    async () => {
      return {
        success: true,
        message: "Platform permission verified",
        permission: "platform.manage"
      };
    }
  );

  // Securely bootstrap Super Admin if environment credentials configured
  await bootstrapSuperAdmin();

  return app;
}