import { Request, Response, NextFunction } from 'express';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = RegisterSchema.parse(req.body);
    const existing = await db('users').where({ email: input.email }).first();
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const id = uuidv4();

    await db('users').insert({
      id,
      email: input.email,
      name: input.name || null,
      hashed_password: hashedPassword,
      tier: 'free',
      created_at: new Date(),
    });

    const token = signToken({ id, email: input.email, tier: 'free' });
    res.status(201).json({ success: true, token, user: { id, email: input.email, tier: 'free' } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = LoginSchema.parse(req.body);
    const user = await db('users').where({ email: input.email }).first();
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(input.password, user.hashed_password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ id: user.id, email: user.email, tier: user.tier });
    res.json({ success: true, token, user: { id: user.id, email: user.email, tier: user.tier } });
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const projects = await db('projects')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .select('id', 'idea_text', 'project_name', 'status', 'created_at');
    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
}

