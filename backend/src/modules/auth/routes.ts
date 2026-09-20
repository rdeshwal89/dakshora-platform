import { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";

export async function authRoutes(app: FastifyInstance) {
  // 1. POST /api/auth/login
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
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

      // Check if user has Two-Factor Authentication (TOTP) enabled
      try {
        const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
        });
        const { data: factorsData } = await userClient.auth.mfa.listFactors();
        const verifiedTotp = factorsData?.totp?.find(f => f.status === "verified");
        if (verifiedTotp) {
          return reply.send({
            success: true,
            mfaRequired: true,
            factorId: verifiedTotp.id,
            tempToken: data.session.access_token,
            message: "Two-Factor Authentication (TOTP) code required."
          });
        }
      } catch (mfaCheckErr: any) {
        request.log.warn(`MFA factor check warning: ${mfaCheckErr.message}`);
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    }
  );

  // 2. POST /api/auth/mfa/enroll (Protected)
  app.post(
    "/api/auth/mfa/enroll",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization!;
        const token = authHeader.substring(7);
        const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userClient.auth.mfa.enroll({
          factorType: "totp",
          issuer: "DAKSHORA 2.0",
          friendlyName: request.user?.email || "User"
        });

        if (error) {
          return reply.code(400).send({ success: false, message: error.message });
        }

        return reply.send({
          success: true,
          factorId: data.id,
          secret: data.totp?.secret,
          qrCode: data.totp?.qr_code,
          uri: data.totp?.uri
        });
      } catch (err: any) {
        return reply.code(500).send({ success: false, message: "MFA enrollment failed", error: err.message });
      }
    }
  );

  // 3. POST /api/auth/mfa/verify
  app.post(
    "/api/auth/mfa/verify",
    async (request, reply) => {
      try {
        const body = request.body as {
          factorId?: string;
          code?: string;
          tempToken?: string;
        };

        const token = body?.tempToken || (request.headers.authorization ? request.headers.authorization.substring(7) : null);
        const { factorId, code } = body || {};

        if (!token) {
          return reply.code(401).send({ success: false, message: "Authentication token required for MFA verification" });
        }
        if (!factorId || !code) {
          return reply.code(400).send({ success: false, message: "Factor ID and 6-digit code are required" });
        }

        const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userClient.auth.mfa.challengeAndVerify({
          factorId,
          code: String(code).trim()
        });

        if (error) {
          return reply.code(400).send({ success: false, message: "Invalid or expired 2FA code", error: error.message });
        }

        const accessToken = data.access_token || (data as any).session?.access_token;

        return reply.send({
          success: true,
          message: `Two-factor authentication verified! 🚀`,
          token: accessToken,
          access_token: accessToken,
          session: data,
          user: data.user
        });
      } catch (err: any) {
        return reply.code(500).send({ success: false, message: "MFA verification failed", error: err.message });
      }
    }
  );

  // 4. GET /api/auth/mfa/status (Protected)
  app.get(
    "/api/auth/mfa/status",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization!;
        const token = authHeader.substring(7);
        const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userClient.auth.mfa.listFactors();
        if (error) {
          return reply.code(400).send({ success: false, message: error.message });
        }

        const verifiedFactors = data.totp?.filter(f => f.status === "verified") || [];
        return reply.send({
          success: true,
          mfaEnabled: verifiedFactors.length > 0,
          factors: data.totp || []
        });
      } catch (err: any) {
        return reply.code(500).send({ success: false, message: "Failed to fetch MFA status", error: err.message });
      }
    }
  );

  // 5. POST /api/auth/mfa/unenroll (Protected)
  app.post(
    "/api/auth/mfa/unenroll",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization!;
        const token = authHeader.substring(7);
        const body = request.body as { factorId?: string } | undefined;

        const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        });

        let targetFactorId = body?.factorId;
        if (!targetFactorId) {
          const { data: factorsData } = await userClient.auth.mfa.listFactors();
          const factor = factorsData?.totp?.find(f => f.status === "verified") || factorsData?.totp?.[0];
          targetFactorId = factor?.id;
        }

        if (!targetFactorId) {
          return reply.code(400).send({ success: false, message: "No MFA factor found to unenroll" });
        }

        const { error } = await userClient.auth.mfa.unenroll({ factorId: targetFactorId });
        if (error) {
          return reply.code(400).send({ success: false, message: error.message });
        }

        return reply.send({
          success: true,
          message: "Two-Factor Authentication successfully disabled."
        });
      } catch (err: any) {
        return reply.code(500).send({ success: false, message: "Failed to disable MFA", error: err.message });
      }
    }
  );
}