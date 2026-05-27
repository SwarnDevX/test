import { hash, verify } from "@node-rs/bcrypt";
import { TRPCError } from "@trpc/server";
import { authenticator } from "otplib";
import { z } from "zod";

import { loginSchema, signupSchema } from "@flowforge/shared";

import { generateToken } from "../services/auth.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.js";
import { publicProcedure, protectedProcedure, router } from "../trpc.js";

export const authRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });

      const passwordHash = await hash(input.password, 12);
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
      });

      // Create personal workspace
      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: `${input.name}'s Workspace`,
          slug: `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          members: {
            create: { userId: user.id, role: "OWNER", joinedAt: new Date() },
          },
        },
      });

      await sendVerificationEmail(user.email, user.id);
      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: "auth.signup",
          resourceType: "User",
          resourceId: user.id,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        },
      });

      const token = generateToken({ userId: user.id, workspaceId: workspace.id });
      return { user: { id: user.id, name: user.name, email: user.email }, token, workspaceId: workspace.id };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user?.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

      const valid = await verify(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

      if (user.twoFactorEnabled) {
        if (!input.totpCode) {
          return { requiresTwoFactor: true };
        }
        if (!user.twoFactorSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const isValid = authenticator.verify({ token: input.totpCode, secret: user.twoFactorSecret });
        if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid 2FA code" });
      }

      const workspace = await ctx.prisma.workspaceMember.findFirst({
        where: { userId: user.id, role: "OWNER" },
        include: { workspace: true },
      });

      const token = generateToken({ userId: user.id, workspaceId: workspace?.workspaceId });
      return {
        requiresTwoFactor: false,
        user: { id: user.id, name: user.name, email: user.email, image: user.image },
        token,
        workspaceId: workspace?.workspaceId,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true, name: true, email: true, image: true,
        emailVerified: true, twoFactorEnabled: true,
        workspaceMembers: {
          include: { workspace: { select: { id: true, name: true, slug: true, plan: true, logoUrl: true } } },
          where: { workspace: { deletedAt: null } },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) return { success: true }; // Don't reveal existence

      await sendPasswordResetEmail(user.email, user.id);
      return { success: true };
    }),

  setup2fa: protectedProcedure.mutation(async ({ ctx }) => {
    const secret = authenticator.generateSecret();
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    const otpauth = authenticator.keyuri(user.email, "FlowForge", secret);

    await ctx.prisma.user.update({
      where: { id: ctx.userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauth };
  }),

  verify2fa: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
      if (!user.twoFactorSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA not set up" });

      const isValid = authenticator.verify({ token: input.code, secret: user.twoFactorSecret });
      if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid code" });

      await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: { twoFactorEnabled: true },
      });

      return { success: true };
    }),

  disable2fa: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
      if (!user.twoFactorSecret) throw new TRPCError({ code: "BAD_REQUEST" });

      const isValid = authenticator.verify({ token: input.code, secret: user.twoFactorSecret });
      if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid code" });

      await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });

      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100).optional(), image: z.string().url().optional() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: input,
        select: { id: true, name: true, email: true, image: true },
      });
      return user;
    }),
});
