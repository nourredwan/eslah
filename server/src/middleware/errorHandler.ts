import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Server Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  // Handle Multer errors (file size, format)
  if (err.name === 'MulterError' || (err.message && err.message.includes('صيغة الملف غير مدعومة'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'خطأ أثناء رفع الملفات، يرجى التأكد من الحجم والصيغة',
    });
  }

  // Handle Prisma unique constraint violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['الحقل'];
      return res.status(409).json({
        success: false,
        message: `القيمة المدخلة في ${target.join(', ')} مسجلة مسبقاً ومستخدمة`,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'السجل المطلوب غير موجود',
      });
    }
  }

  // Generic or Custom Error
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً'
      : err.message || 'حدث خطأ في الخادم';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
