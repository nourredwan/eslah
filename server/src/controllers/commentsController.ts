import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export async function addComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول للتعليق' });
    }

    const { id: reportId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'نص التعليق لا يمكن أن يكون فارغاً' });
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'البلاغ غير موجود' });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        reportId,
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة التعليق بنجاح',
      data: {
        id: comment.id,
        userId: comment.userId,
        userName: comment.user.name,
        userAvatar: comment.user.avatar,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'التعليق غير موجود' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'لا تملك صلاحية حذف هذا التعليق' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return res.json({ success: true, message: 'تم حذف التعليق بنجاح' });
  } catch (error) {
    next(error);
  }
}
