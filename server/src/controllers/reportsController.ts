import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { AuthRequest } from '../middleware/auth.js';
import { ReportCategory, ReportPriority, ReportStatus } from '@prisma/client';

export async function getReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      category,
      status,
      priority,
      search,
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Filters
    const where: any = {};

    if (category && category !== 'all') {
      where.category = category as ReportCategory;
    }

    if (status && status !== 'all') {
      where.status = status as ReportStatus;
    }

    if (priority && priority !== 'all') {
      where.priority = priority as ReportPriority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'upvotes') {
      orderBy = { upvotes: { _count: 'desc' } };
    } else if (sortBy === 'priority') {
      orderBy = [{ priority: 'asc' }, { createdAt: 'desc' }];
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          reportedBy: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          adoptedBy: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          comments: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          upvotes: {
            select: { userId: true },
          },
        },
      }),
    ]);

    // Transform reports to match frontend format
    const transformed = reports.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      priority: r.priority,
      status: r.status,
      location: {
        lat: r.lat,
        lng: r.lng,
        address: r.address,
      },
      images: r.images,
      reportedBy: r.reportedById,
      reportedByName: r.reportedBy?.name,
      adoptedBy: r.adoptedById || undefined,
      adoptedByName: r.adoptedBy?.name || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      comments: r.comments.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userAvatar: c.user.avatar,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      upvotes: r.upvotes.length,
      upvotedBy: r.upvotes.map(u => u.userId),
    }));

    return res.json({
      success: true,
      data: transformed,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: { id: true, name: true, avatar: true, role: true, phone: true, email: true },
        },
        adoptedBy: {
          select: { id: true, name: true, avatar: true, role: true, phone: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        upvotes: {
          select: { userId: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'البلاغ غير موجود',
      });
    }

    const transformed = {
      id: report.id,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      status: report.status,
      location: {
        lat: report.lat,
        lng: report.lng,
        address: report.address,
      },
      images: report.images,
      reportedBy: report.reportedById,
      reportedByName: report.reportedBy?.name,
      adoptedBy: report.adoptedById || undefined,
      adoptedByName: report.adoptedBy?.name || undefined,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      comments: report.comments.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userAvatar: c.user.avatar,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      upvotes: report.upvotes.length,
      upvotedBy: report.upvotes.map(u => u.userId),
    };

    return res.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    next(error);
  }
}

export async function createReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول لتقديم بلاغ' });
    }

    const {
      title,
      description,
      category,
      priority = 'medium',
      address,
      lat = 24.7136,
      lng = 46.6753,
    } = req.body;

    if (!title || !description || !address || !category) {
      return res.status(400).json({
        success: false,
        message: 'العنوان والوصف والموقع والتصنيف حقول مطلوبة',
      });
    }

    // Upload files to Cloudinary if provided
    const imageUrls: string[] = [];
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadedUrl = await uploadToCloudinary(file.buffer, 'community_platform/reports');
        imageUrls.push(uploadedUrl);
      }
    }

    // Also support any string image URLs passed in body
    if (req.body.images && Array.isArray(req.body.images)) {
      imageUrls.push(...req.body.images);
    }

    const report = await prisma.report.create({
      data: {
        title,
        description,
        category: category as ReportCategory,
        priority: priority as ReportPriority,
        status: 'new',
        address,
        lat: parseFloat(String(lat)) || 24.7136,
        lng: parseFloat(String(lng)) || 46.6753,
        images: imageUrls,
        reportedById: req.user.id,
      },
      include: {
        reportedBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Increment user's reports count and reward points
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        reportsCount: { increment: 1 },
        points: { increment: 15 },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل البلاغ بنجاح في قاعدة البيانات',
      data: {
        id: report.id,
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority,
        status: report.status,
        location: {
          lat: report.lat,
          lng: report.lng,
          address: report.address,
        },
        images: report.images,
        reportedBy: report.reportedById,
        reportedByName: report.reportedBy.name,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        comments: [],
        upvotes: 0,
        upvotedBy: [],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const { id } = req.params;
    const { status, title, description, priority, category } = req.body;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'البلاغ غير موجود' });
    }

    // Permission check: only admin, reporter, or adopter can update
    const isOwner = report.reportedById === req.user.id;
    const isAdopter = report.adoptedById === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdopter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا البلاغ',
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        ...(status ? { status: status as ReportStatus } : {}),
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(priority ? { priority: priority as ReportPriority } : {}),
        ...(category ? { category: category as ReportCategory } : {}),
      },
      include: {
        reportedBy: { select: { id: true, name: true, avatar: true } },
        adoptedBy: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        upvotes: { select: { userId: true } },
      },
    });

    // If marked as completed by adopter, reward the adopter
    if (status === 'completed' && report.status !== 'completed' && report.adoptedById) {
      await prisma.user.update({
        where: { id: report.adoptedById },
        data: {
          resolvedCount: { increment: 1 },
          points: { increment: 50 },
        },
      });
    }

    const transformed = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      location: {
        lat: updated.lat,
        lng: updated.lng,
        address: updated.address,
      },
      images: updated.images,
      reportedBy: updated.reportedById,
      reportedByName: updated.reportedBy?.name,
      adoptedBy: updated.adoptedById || undefined,
      adoptedByName: updated.adoptedBy?.name || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      comments: updated.comments.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userAvatar: c.user.avatar,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      upvotes: updated.upvotes.length,
      upvotedBy: updated.upvotes.map(u => u.userId),
    };

    return res.json({
      success: true,
      message: 'تم تحديث البلاغ بنجاح',
      data: transformed,
    });
  } catch (error) {
    next(error);
  }
}

export async function adoptReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول' });
    }

    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'البلاغ غير موجود' });
    }

    if (report.adoptedById) {
      return res.status(400).json({
        success: false,
        message: 'هذا البلاغ تم تبنيه مسبقاً من قبل متطوع آخر',
      });
    }

    if (report.reportedById === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك تبني بلاغ قمت بإنشائه بنفسك',
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        adoptedById: req.user.id,
        status: 'in_progress',
      },
      include: {
        reportedBy: { select: { id: true, name: true, avatar: true } },
        adoptedBy: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        upvotes: { select: { userId: true } },
      },
    });

    const transformed = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      location: {
        lat: updated.lat,
        lng: updated.lng,
        address: updated.address,
      },
      images: updated.images,
      reportedBy: updated.reportedById,
      reportedByName: updated.reportedBy?.name,
      adoptedBy: updated.adoptedById || undefined,
      adoptedByName: updated.adoptedBy?.name || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      comments: updated.comments.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userAvatar: c.user.avatar,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      upvotes: updated.upvotes.length,
      upvotedBy: updated.upvotes.map(u => u.userId),
    };

    return res.json({
      success: true,
      message: 'تم تبني البلاغ بنجاح، شكراً لمبادرتك!',
      data: transformed,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUpvote(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'يرجى تسجيل الدخول للتصويت' });
    }

    const { id: reportId } = req.params;
    const userId = req.user.id;

    const targetReport = await prisma.report.findUnique({ where: { id: reportId } });
    if (!targetReport) {
      return res.status(404).json({ success: false, message: 'البلاغ غير موجود' });
    }

    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        reportId_userId: { reportId, userId },
      },
    });

    if (existingUpvote) {
      await prisma.upvote.delete({
        where: { id: existingUpvote.id },
      });
      return res.json({
        success: true,
        message: 'تم إلغاء التصويت',
        action: 'removed',
      });
    } else {
      await prisma.upvote.create({
        data: { reportId, userId },
      });
      return res.json({
        success: true,
        message: 'تم التصويت بنجاح لدعم البلاغ',
        action: 'added',
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }

    const { id } = req.params;
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ success: false, message: 'البلاغ غير موجود' });
    }

    const isOwner = report.reportedById === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا البلاغ',
      });
    }

    await prisma.report.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'تم حذف البلاغ بنجاح',
    });
  } catch (error) {
    next(error);
  }
}
