import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').toLowerCase().trim(),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100),
    role: z.enum(['user', 'volunteer', 'organization']).default('user'),
    bio: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
    avatar: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').toLowerCase().trim(),
    password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
  }),
});

function generateToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, bio, phone, avatar } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول',
      });
    }

    // High security encryption (12 salt rounds)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        bio,
        phone,
        avatar: avatar || (role === 'volunteer' ? '👩' : role === 'organization' ? '🏢' : '👤'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        points: true,
        rating: true,
        bio: true,
        phone: true,
        reportsCount: true,
        resolvedCount: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.email, user.role);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          ...user,
          joinedAt: user.createdAt.toISOString().split('T')[0],
          badges: [],
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        badges: {
          include: { badge: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          ...userWithoutPassword,
          joinedAt: user.createdAt.toISOString().split('T')[0],
          badges: user.badges.map(b => ({
            id: b.badge.id,
            name: b.badge.name,
            icon: b.badge.icon,
            description: b.badge.description,
            earnedAt: b.earnedAt,
          })),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        badges: {
          include: { badge: true },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        joinedAt: user.createdAt.toISOString().split('T')[0],
        badges: user.badges.map(b => ({
          id: b.badge.id,
          name: b.badge.name,
          icon: b.badge.icon,
          description: b.badge.description,
          earnedAt: b.earnedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const { name, bio, phone, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatar ? { avatar } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        points: true,
        rating: true,
        bio: true,
        phone: true,
        reportsCount: true,
        resolvedCount: true,
      },
    });

    return res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
