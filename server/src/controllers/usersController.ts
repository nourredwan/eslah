import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

export async function getVolunteers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, search } = req.query as { role?: string; search?: string };

    const where: any = {};

    if (role === 'all') {
      // Allow fetching all users (e.g. for Admin panel)
    } else if (role && ['volunteer', 'organization', 'user', 'admin'].includes(role)) {
      where.role = role as Role;
    } else {
      where.role = { in: ['volunteer', 'organization'] };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { points: 'desc' },
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
        badges: {
          include: { badge: true },
        },
      },
    });

    const transformed = users.map(u => ({
      ...u,
      joinedAt: u.createdAt.toISOString().split('T')[0],
      badges: u.badges.map(b => ({
        id: b.badge.id,
        name: b.badge.name,
        icon: b.badge.icon,
        description: b.badge.description,
        earnedAt: b.earnedAt,
      })),
    }));

    return res.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        badges: {
          include: { badge: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    return res.json({
      success: true,
      data: {
        ...user,
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

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح، يتطلب صلاحية المدير' });
    }

    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    next(error);
  }
}
