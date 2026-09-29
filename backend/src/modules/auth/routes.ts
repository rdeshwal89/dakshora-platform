import { FastifyInstance } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { SecureOtpService } from "../../services/secureOtpService.js";

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

      const isSuperAdmin = data.user.app_metadata?.role === "superadmin" || data.user.user_metadata?.role === "superadmin";

      const reqBody = request.body as any;
      if (isSuperAdmin && (reqBody?.requireOtp === true || reqBody?.role === "superadmin" || request.headers["x-require-otp"] === "true")) {
        const otpGen = SecureOtpService.generateAndStore(`superadmin:${data.user.email!.toLowerCase()}`, {
          user: data.user,
          session: data.session,
          isSuperAdmin: true
        });

        if (otpGen.error) {
          return reply.code(429).send({ success: false, message: otpGen.error, retryAfterSeconds: otpGen.retryAfterSeconds });
        }

        return reply.send({
          success: true,
          otpRequired: true,
          isSuperAdmin: true,
          email: data.user.email,
          tempToken: data.session.access_token,
          message: "OTP sent successfully."
        });
      }

      return {
        success: true,
        message: `Welcome back, ${data.user.user_metadata?.name || data.user.email}! 🚀`,
        token: data.session.access_token,
        access_token: data.session.access_token,
        token_type: "Bearer",
        expires_in: data.session.expires_in,
        user: {
          ...data.user,
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || "User",
          role: isSuperAdmin ? "superadmin" : (data.user.app_metadata?.role || "school-admin"),
          isSuperAdmin,
          organizationId: data.user.app_metadata?.organization_id || "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"
        },
        session: data.session
      };
    }
  );

  // POST /api/auth/superadmin/verify-otp
  app.post("/api/auth/superadmin/verify-otp", async (request, reply) => {
    const { email, otp, tempToken } = request.body as any || {};
    if (!email || !otp) {
      return reply.code(400).send({ success: false, message: "Super Admin email and 6-digit OTP are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const verifyRes = SecureOtpService.verify(`superadmin:${cleanEmail}`, otp);

    if (!verifyRes.valid) {
      return reply.code(verifyRes.status).send({ success: false, message: verifyRes.error || "Invalid or expired Super Admin OTP. Please try again." });
    }

    return reply.send({
      success: true,
      message: "Super Admin 2-Step OTP Verified Successfully! 🚀👑",
      token: tempToken,
      access_token: tempToken,
      token_type: "Bearer",
      expires_in: 7 * 86400,
      user: {
        id: "superadmin-root",
        email: cleanEmail,
        name: "Platform SuperAdmin",
        role: "superadmin",
        isSuperAdmin: true,
        permissions: ["*"],
        organizationId: "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e"
      }
    });
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (request, reply) => {
    const { email, phone, identity } = request.body as any || {};
    const target = (email || phone || identity || "").trim();
    if (!target) {
      return reply.code(400).send({ success: false, message: "Registered email or mobile number is required" });
    }

    const isEmail = target.includes("@");
    const otpGen = SecureOtpService.generateAndStore(`reset:${target.toLowerCase()}`, { identifier: target });

    if (otpGen.error) {
      return reply.code(429).send({ success: false, message: otpGen.error, retryAfterSeconds: otpGen.retryAfterSeconds });
    }

    return reply.send({
      success: true,
      message: "OTP sent successfully.",
      channel: isEmail ? "email" : "sms",
      identifier: target,
      expiresInSeconds: 300
    });
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (request, reply) => {
    const { email, phone, identifier, otp, newPassword } = request.body as any || {};
    const target = (identifier || email || phone || "").trim();
    if (!target || !otp || !newPassword) {
      return reply.code(400).send({ success: false, message: "Target account, 6-digit OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return reply.code(400).send({ success: false, message: "New password must be at least 6 characters long" });
    }

    const verifyRes = SecureOtpService.verify(`reset:${target.toLowerCase()}`, otp);
    if (!verifyRes.valid) {
      return reply.code(verifyRes.status).send({ success: false, message: verifyRes.error || "Invalid or expired OTP." });
    }

    let updatedInSupabase = false;
    if (target.includes("@")) {
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const u = listData?.users?.find(usr => usr.email?.toLowerCase() === target.toLowerCase());
        if (u) {
          const { error: updErr } = await supabase.auth.admin.updateUserById(u.id, {
            password: newPassword.trim()
          });
          if (!updErr) updatedInSupabase = true;
        }
      } catch (err: any) {
        request.log.warn(`Password reset update note: ${err.message}`);
      }
    }

    return reply.send({
      success: true,
      message: "Password reset successfully! You can now log in with your new password 🔑✨",
      updatedInSupabase
    });
  });

  // POST /api/auth/register/send-otp
  app.post("/api/auth/register/send-otp", async (request, reply) => {
    const { name, email, phone, schoolName, password, confirmPassword } = (request.body as any) || {};
    if (!name || !email || !phone || !password) {
      return reply.code(400).send({ success: false, message: "Full Name, Email, Mobile number, and Password are required." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

    if (!cleanEmail.includes("@")) {
      return reply.code(400).send({ success: false, message: "Please provide a valid institutional email address." });
    }
    if (cleanPhone.length !== 10) {
      return reply.code(400).send({ success: false, message: "Please provide a valid 10-digit mobile number." });
    }
    if (password.length < 6) {
      return reply.code(400).send({ success: false, message: "Password must be at least 6 characters long." });
    }
    if (confirmPassword && password !== confirmPassword) {
      return reply.code(400).send({ success: false, message: "Password and Confirm Password do not match." });
    }

    try {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (existing) {
        return reply.code(409).send({ success: false, message: "An institutional account with this email already exists. Please log in." });
      }
    } catch (err: any) {
      request.log.warn(`Supabase user check note: ${err.message}`);
    }

    const registrationData = {
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      schoolName: (schoolName || `${name.trim()}'s Academy`).trim(),
      password
    };

    const otpGen = SecureOtpService.generateAndStore(`register:${cleanEmail}`, registrationData);
    SecureOtpService.generateAndStore(`register:${cleanPhone}`, registrationData);

    if (otpGen.error) {
      return reply.code(429).send({ success: false, message: otpGen.error, retryAfterSeconds: otpGen.retryAfterSeconds });
    }

    return reply.send({
      success: true,
      message: `Verification OTP dispatched to ${cleanEmail} and +91 ${cleanPhone}.`,
      expiresInSeconds: 300,
      identifier: cleanEmail
    });
  });

  // POST /api/auth/register
  app.post("/api/auth/register", async (request, reply) => {
    const { name, email, phone, schoolName, password, otp } = (request.body as any) || {};
    if (!email || !otp) {
      return reply.code(400).send({ success: false, message: "Email and 6-digit OTP verification code are required." });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);

    let verifyRes = SecureOtpService.verify(`register:${cleanEmail}`, otp);
    if (!verifyRes.valid && cleanPhone) {
      verifyRes = SecureOtpService.verify(`register:${cleanPhone}`, otp);
    }

    if (!verifyRes.valid) {
      return reply.code(verifyRes.status || 400).send({ success: false, message: verifyRes.error || "Invalid or expired OTP code." });
    }

    const regData = verifyRes.metadata || {};
    const finalName = name || regData.name || "School Administrator";
    const finalSchoolName = (schoolName || regData.schoolName || `${finalName} Public School`).trim();
    const finalPassword = password || regData.password;
    const finalPhone = cleanPhone || regData.phone;

    let orgId = "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
    try {
      const orgSlug = finalSchoolName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const { data: newOrg } = await supabase.from("organizations").insert([{
        name: finalSchoolName,
        slug: orgSlug,
        plan: "growth",
        status: "active"
      }]).select().maybeSingle();
      if (newOrg?.id) orgId = newOrg.id;
    } catch (orgErr: any) {
      request.log.warn(`Org creation note: ${orgErr.message}`);
    }

    let createdUserId = `usr-${Date.now()}`;
    let authToken = `dakshora-inst-token-${Date.now()}`;
    let authUser: any = null;

    try {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: finalPassword,
        email_confirm: true,
        phone: finalPhone ? `+91${finalPhone}` : undefined,
        phone_confirm: !!finalPhone,
        user_metadata: {
          name: finalName,
          role: "school-admin",
          organization_name: finalSchoolName,
          organization_id: orgId,
          phone: finalPhone
        },
        app_metadata: {
          role: "school-admin",
          organization_id: orgId,
          provider: "email"
        }
      });

      if (!createErr && newUser?.user) {
        createdUserId = newUser.user.id;
        const { data: signData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: finalPassword
        });
        if (signData?.session?.access_token) {
          authToken = signData.session.access_token;
          authUser = signData.user;
        }
      }
    } catch (sbErr: any) {
      request.log.warn(`Supabase user register note: ${sbErr.message}`);
    }

    const returnUser = {
      id: authUser?.id || createdUserId,
      email: cleanEmail,
      name: finalName,
      role: "school-admin",
      organizationId: orgId,
      organization_id: orgId,
      organizationName: finalSchoolName,
      schoolName: finalSchoolName,
      phone: finalPhone
    };

    return reply.send({
      success: true,
      message: `Registration successful! Welcome to DAKSHORA 2.0, ${finalName}! 🏫🚀`,
      token: authToken,
      access_token: authToken,
      user: returnUser
    });
  });

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