import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  { id: 'b1', name: 'متطوع متميز', icon: '🏆', description: 'أفضل متطوع في الشهر' },
  { id: 'b2', name: 'استجابة سريعة', icon: '⚡', description: 'استجابة خلال أقل من ساعة' },
  { id: 'b3', name: 'خبير حلول', icon: '🧠', description: 'حل أكثر من 50 بلاغ' },
  { id: 'b4', name: 'صاحب قلب', icon: '❤️', description: 'مساعدة في حالات إنسانية' },
  { id: 'b5', name: 'مراقب البيئة', icon: '🌿', description: 'الإبلاغ عن قضايا بيئية' },
  { id: 'b6', name: 'بطل الحي', icon: '🏘️', description: 'أكثر المتطوعين نشاطاً في الحي' },
];

async function main() {
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      create: badge,
      update: { name: badge.name, icon: badge.icon, description: badge.description },
    });
  }
  console.log('تم التأكد من وجود تعريفات الشارات. لم يتم حذف أو إنشاء أي مستخدمين أو بلاغات.');
}

main().catch(error => {
  console.error('تعذر تجهيز الشارات:', error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
