# خادم منصة إصلاح (Community Problem Reporting Platform Backend)

خادم متكامل مبني باستخدام **Node.js** و **Express** وقاعدة بيانات **PostgreSQL** عبر **Prisma ORM** مع تخزين سحابي للصور والوسائط على **Cloudinary**، مع تطبيق أعلى معايير الأمان والتشفير.

---

## 🛡️ ميزات الأمان والتشفير العالية (High Security & Encryption)

1. **تشفير كلمات المرور (Password Hashing):**
   - استخدام خوارزمية `bcryptjs` مع جولات تشفير قوية (**12 Salt Rounds**)، مما يجعل كسر التشفير بالقوة الغاشمة شبه مستحيل.
2. **المصادقة والتفويض (JWT & RBAC):**
   - إصدار وتوقيع رموز **JSON Web Tokens (JWT)** مع تاريخ انتهاء صلاحية محدد (`7d`).
   - نظام حماية للأدوار (**Role-Based Access Control**): فحص صلاحيات المستخدمين (`user`, `volunteer`, `organization`, `admin`) لحماية المسارات الحساسة.
3. **منع هجمات التخمين والتعطيل (Rate Limiting):**
   - حد صارم على مسارات تسجيل الدخول وإنشاء الحساب: **15 محاولة كحد أقصى لكل 15 دقيقة** لكل IP لمنع Brute Force.
   - حد عام على مسارات الـ API: **150 طلباً في الدقيقة** لحماية موارد الخادم.
4. **حماية الترويسات (Security Headers via Helmet):**
   - تفعيل سياسات الأمان لمنع هجمات XSS، Clickjacking، و Sniffing عبر مكتبة `helmet`.
5. **التحقق من البيانات والتعقيم (Data Validation via Zod):**
   - فحص صارم لكافة البيانات الواردة في الـ Body والـ Query لضمان صحتها ومنع حقن البيانات الخبيثة.
6. **الحماية من SQL Injection:**
   - مضمونة 100% عبر استعلامات **Prisma ORM** المجهزة مسبقاً (Parameterized Queries).
7. **التعامل الآمن مع الملفات والصور:**
   - فحص نوع الملفات (MIME-Type: JPG, PNG, WEBP فقط) والحد الأقصى للحجم (5MB).
   - الرفع السحابي المشفر إلى Cloudinary دون حفظ الملفات المؤقتة محلياً.

---

## ⚙️ متغيرات البيئة (`.env`)

أنشئ ملف `.env` داخل مجلد `server/` بناءً على `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# رابط الاتصال بقاعدة بيانات PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/community_reports?schema=public"

# مفتاح التشفير السري لـ JWT
JWT_SECRET=super_secret_jwt_encryption_key_community_platform_2026_change_in_production
JWT_EXPIRES_IN=7d

# إعدادات Cloudinary لرفع الصور
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 التشغيل والإعداد

### 1. تثبيت الحزم:
```bash
cd server
npm install
```

### 2. تجهيز قاعدة بيانات PostgreSQL:
* يمكنك استخدام PostgreSQL محلي، أو استخدام خدمة سحابية مجانية وسريعة مثل **Neon.tech** أو **Supabase** أو **Railway** ولصق رابط الاتصال في `DATABASE_URL`.
* دفع المخطط لقاعدة البيانات:
```bash
npm run prisma:push
```
* تعبئة البيانات التأسيسية (Seed):
```bash
npm run prisma:seed
```

### 3. تشغيل الخادم في وضع التطوير:
```bash
npm run dev
```

---

## 📋 المسارات الرئيسية (API Endpoints)

| المسار | الطريقة | الوصف | الصلاحية |
| :--- | :---: | :--- | :---: |
| `/health` | `GET` | فحص صحة الخادم وقاعدة البيانات | عام |
| `/api/auth/register` | `POST` | إنشاء حساب جديد | عام (خاضع للـ Rate Limit) |
| `/api/auth/login` | `POST` | تسجيل الدخول واستلام JWT | عام (خاضع للـ Rate Limit) |
| `/api/auth/me` | `GET` | جلب بيانات المستخدم الحالي | مستخدم مسجل |
| `/api/auth/profile` | `PUT` | تحديث الملف الشخصي | مستخدم مسجل |
| `/api/reports` | `GET` | استعراض البلاغات (مع الفلاتر والبحث والترتيب) | عام |
| `/api/reports/:id` | `GET` | تفاصيل بلاغ معين مع التعليقات والمصوتين | عام |
| `/api/reports` | `POST` | إنشاء بلاغ جديد مع رفع حتى 5 صور لـ Cloudinary | مستخدم مسجل |
| `/api/reports/:id` | `PUT` | تحديث حالة أو تفاصيل البلاغ | صاحب البلاغ أو المتبني أو المدير |
| `/api/reports/:id/adopt`| `POST` | تبني بلاغ من قبل متطوع | متطوع / مؤسسة |
| `/api/reports/:id/upvote`| `POST`| دعم/تصويت للبلاغ (Toggle) | مستخدم مسجل |
| `/api/reports/:id` | `DELETE` | حذف بلاغ | صاحب البلاغ أو المدير |
| `/api/reports/:id/comments` | `POST` | إضافة تعليق على بلاغ | مستخدم مسجل |
| `/api/users/volunteers` | `GET` | لوحة الشرف وأفضل المتطوعين | عام |
| `/api/users/:id` | `GET` | ملف مستخدم محدد | عام |
| `/api/stats` | `GET` | إحصائيات المنصة الشاملة | عام |
