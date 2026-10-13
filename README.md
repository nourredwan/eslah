# منصة إصلاح المجتمعية (Full-Stack Community Platform)

منصة مجتمعية متكاملة (Full-Stack) تتيح للمواطنين الإبلاغ عن المشكلات المحلية (طرق، مياه، كهرباء، بيئة، حالات إنسانية) وتمكين المتطوعين والجهات من تبنيها وحلها ومتابعتها.

---

## 🏗️ البنية والمعمارية البرمجية

```
community-problem-reporting-platform/
├── server/                          # خادم Backend (Node.js + Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma            # مخطط قاعدة البيانات لـ PostgreSQL
│   │   └── seed.ts                  # تعبئة البيانات الأولية
│   ├── src/
│   │   ├── config/                  # إعدادات Prisma، Cloudinary، ومتغيرات البيئة
│   │   ├── controllers/             # وحدات التحكم (Auth, Reports, Comments, Users, Stats)
│   │   ├── middleware/              # حماية الأمان (JWT, RBAC, Rate Limiting, Multer, Error Handler)
│   │   ├── routes/                  # مسارات REST API
│   │   └── index.ts                 # نقطة تشغيل الخادم
│   ├── .env.example
│   └── package.json
├── src/                             # واجهة المستخدم Frontend (React 19 + TypeScript + Tailwind)
│   ├── components/                  # المكونات (Layout, AuthModal, ...)
│   ├── pages/                       # الصفحات (Home, Reports, NewReport, Admin, Volunteers, Profile)
│   ├── services/
│   │   └── api.ts                   # طبقة الاتصال بـ API مع التخزين الآمن للـ Token
│   └── context.tsx                  # إدارة الحالة وتتبع اتصال الخادم وقاعدة البيانات
└── package.json
```

---

## 🛡️ معايير الأمان والتشفير المطبقة

* **تشفير كلمات المرور:** خوارزمية `bcryptjs` مع جولات تشفير قوية (**12 Salt Rounds**).
* **المصادقة والتفويض:** رموز **JSON Web Tokens (JWT)** موقعة بمفتاح سري مشفر وصلاحية محددة مع نظام أدوار (**RBAC**).
* **منع هجمات التخمين (Rate Limiting):** تقييد محاولات الدخول عبر `express-rate-limit` (15 محاولة / 15 دقيقة)، و 150 طلب / دقيقة للـ API.
* **حماية الترويسات (Security Headers):** عبر `helmet` لمنع هجمات XSS، Clickjacking، و Sniffing.
* **الحماية من SQL Injection:** مضمونة بالكامل عبر **Prisma ORM** بالاستعلامات المجهزة مسبقاً.
* **التحقق من البيانات:** تدقيق المدخلات وصحتها باستخدام `zod`.
* **التخزين السحابي الآمن:** فحص الصور والـ MIME-Types ورفعها المشفر إلى **Cloudinary**.

---

## ⚡ التشغيل السريع

### 1. تشغيل واجهة المستخدم (Frontend):
```bash
npm install
npm run dev
```
تفتح الواجهة على: `http://localhost:5173`

### 2. تشغيل الخادم (Backend):
```bash
npm run server:dev
```
يعمل الخادم على: `http://localhost:5000`

---

## 🗄️ ربط قاعدة بيانات PostgreSQL و Cloudinary

1. افتح ملف `server/.env`:
```env
# ضع رابط قاعدة بيانات PostgreSQL (محلي أو سحابي مجاني مثل Neon.tech أو Supabase)
DATABASE_URL="postgresql://postgres:password@localhost:5432/community_reports?schema=public"

# بيانات حساب Cloudinary (مجاني على https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. تطبيق الجداول وتعبئة البيانات التأسيسية:
```bash
# إنشاء الجداول تلقائياً في PostgreSQL
npm --prefix server run prisma:push

# تعبئة المستخدمين والبلاغات التجريبية
npm run server:seed
```

3. حسابات متاحة في قواعد البيانات التي سبق تعبئتها للتجربة (لا تُنشأ تلقائياً ولا تستخدمها في الإنتاج):
* **مدير منصة (Admin):** `admin@example.com` / كلمة المرور: `password123`
* **متطوعة (Volunteer):** `sara@example.com` / كلمة المرور: `password123`
* **مواطن (Citizen):** `ahmed@example.com` / كلمة المرور: `password123`

### تشغيل نسخة الإنتاج

اضبط متغيرات `server/.env` أو متغيرات بيئة الخادم (`DATABASE_URL` و`JWT_SECRET` وبيانات Cloudinary، و`CLIENT_URL` عند استضافة الواجهة على نطاق منفصل). استخدم مفتاح JWT عشوائياً وفريداً. عند تقديم الواجهة والخادم من نفس الخادم، لا يلزم `VITE_API_URL`؛ أما النطاق المنفصل فيستخدم `VITE_API_URL=https://api.example.com/api` ويُضاف نطاق الواجهة إلى `CORS_ORIGINS`.

```bash
npm install
npm --prefix server install
npm run build
npm run server:build
npm run server:migrate:deploy
npm run server:start
```

يقوم خادم الإنتاج بعرض واجهة `dist` ومسارات API وفحص `/health`. ترحيل البداية يسجل المخطط الموجود، وإذا كانت قاعدة البيانات جديدة فيُطبق Prisma الترحيلات تلقائياً. تشغيل `server:seed` يضيف تعريفات الشارات فقط ولا يمسح المستخدمين أو البلاغات. تحقق من `/health` حتى تظهر `database: connected` قبل استقبال الاستخدام.
