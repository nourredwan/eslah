import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalReports,
      newReports,
      inProgressReports,
      completedReports,
      urgentReports,
      totalVolunteers,
      totalOrganizations,
      totalUsers,
      recentReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'new' } }),
      prisma.report.count({ where: { status: 'in_progress' } }),
      prisma.report.count({ where: { status: 'completed' } }),
      prisma.report.count({ where: { priority: 'urgent' } }),
      prisma.user.count({ where: { role: 'volunteer' } }),
      prisma.user.count({ where: { role: 'organization' } }),
      prisma.user.count(),
      prisma.report.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true, status: true },
      }),
    ]);

    // Categories count
    const categoriesGroup = await prisma.report.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const categoriesCount = categoriesGroup.map(c => ({
      category: c.category,
      count: c._count.category,
    }));

    const weeklyStats = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - offset));
      const dayReports = recentReports.filter(report => report.createdAt.toDateString() === date.toDateString());
      return {
        day: date.toLocaleDateString('ar', { weekday: 'long' }),
        newReports: dayReports.length,
        resolved: dayReports.filter(report => report.status === 'completed').length,
      };
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          newReports,
          inProgressReports,
          completedReports,
          urgentReports,
          totalVolunteers,
          totalOrganizations,
          totalUsers,
          resolutionRate: totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0,
        },
        categoriesCount,
        weeklyStats,
      },
    });
  } catch (error) {
    next(error);
  }
}
