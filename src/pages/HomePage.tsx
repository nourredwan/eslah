import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  TrendingUp, Users, FileText, CheckCircle2,
  ArrowLeft, AlertTriangle, MapPin, Clock, ThumbsUp,
  ChevronLeft, Zap, Heart, Target
} from 'lucide-react';
import { useApp } from '../context';
import { api } from '../services/api';
import { User } from '../types';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_COLORS, PRIORITY_LABELS,
  STATUS_COLORS, STATUS_LABELS
} from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function ReportMiniCard({ report }: { report: ReturnType<typeof useApp>['reports'][0] }) {
  return (
    <Link to={`/reports/${report.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{CATEGORY_ICONS[report.category]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
              {PRIORITY_LABELS[report.priority]}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
              {STATUS_LABELS[report.status]}
            </span>
          </div>
          <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {report.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {report.location.address.split('،')[1]?.trim() || report.location.address.split('،')[0]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {report.upvotes}
            </span>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-2" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { reports, serverStatus } = useApp();
  const [volunteers, setVolunteers] = useState<User[]>([]);
  useEffect(() => {
    api.users.getVolunteers().then(setVolunteers).catch(error => console.error('تعذر تحميل المتطوعين:', error));
  }, []);

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'completed').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const urgentReports = reports.filter(r => r.priority === 'urgent').length;

  const recentReports = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const urgentList = reports.filter(r => r.priority === 'urgent' && r.status !== 'completed');
  const weeklyTrend = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - offset));
    const key = day.toLocaleDateString('ar-SA', { weekday: 'long' });
    const items = reports.filter(report => new Date(report.createdAt).toDateString() === day.toDateString());
    return { day: key, reports: items.length, resolved: items.filter(report => report.status === 'completed').length };
  });
  const colors = ['#f97316', '#eab308', '#3b82f6', '#ef4444', '#ec4899', '#22c55e', '#a855f7', '#6b7280'];
  const categoryDistribution = Object.entries(CATEGORY_LABELS).map(([category, name], index) => ({
    name, value: reports.filter(report => report.category === category).length, fill: colors[index],
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-bl from-emerald-600 via-emerald-700 to-emerald-900 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-300/10 rounded-full blur-2xl" />
          {/* Pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-emerald-100 text-sm font-medium">{serverStatus === 'connected' ? 'المنصة متصلة بالخادم وقاعدة البيانات' : 'جارٍ الاتصال بالخادم'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                مجتمعنا مسئولية
                <br />
                <span className="text-emerald-300">جميعاً</span>
              </h1>
              <p className="text-emerald-100 text-lg mb-8 leading-relaxed max-w-lg">
                بلّغ عن المشكلات في منطقتك، وتطوّع لمساعدة الآخرين. معاً نصنع الفرق في مجتمعنا.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/reports/new"
                  className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg"
                >
                  <AlertTriangle className="w-4 h-4" />
                  قدّم بلاغ جديد
                </Link>
                <Link
                  to="/reports"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/25 transition-colors border border-white/20"
                >
                  تصفّح البلاغات
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Stats Cards in Hero */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
                <FileText className="w-6 h-6 text-emerald-300 mb-2" />
                <p className="text-2xl sm:text-3xl font-black text-white">{totalReports}</p>
                <p className="text-xs text-emerald-200">إجمالي البلاغات</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
                <CheckCircle2 className="w-6 h-6 text-green-300 mb-2" />
                <p className="text-2xl sm:text-3xl font-black text-white">{resolvedReports}</p>
                <p className="text-xs text-emerald-200">تم حلها</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
                <Users className="w-6 h-6 text-blue-300 mb-2" />
                <p className="text-2xl sm:text-3xl font-black text-white">{volunteers.filter(user => user.role === 'volunteer').length}</p>
                <p className="text-xs text-emerald-200">متطوع نشط</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
                <TrendingUp className="w-6 h-6 text-amber-300 mb-2" />
                <p className="text-2xl sm:text-3xl font-black text-white">{totalReports ? Math.round((resolvedReports / totalReports) * 100) : 0}%</p>
                <p className="text-xs text-emerald-200">نسبة الحل</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 -mt-8 relative z-10 mb-8">
          <Link to="/reports/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group border border-gray-100 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-100 transition-colors">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">بلاغ سريع</p>
            <p className="text-[10px] text-gray-400 mt-0.5">في أقل من 30 ثانية</p>
          </Link>
          <Link to="/reports/new?priority=urgent" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">بلاغ طارئ</p>
            <p className="text-[10px] text-gray-400 mt-0.5">للحالات الحرجة</p>
          </Link>
          <Link to="/volunteers" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition-colors">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">تطوّع</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ساعد مجتمعك</p>
          </Link>
          <Link to="/reports" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-100 transition-colors">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">تصفح البلاغات</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ابحث عن مشكلة</p>
          </Link>
        </div>

        {/* Urgent Reports Alert */}
        {urgentList.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-800">بلاغات عاجلة تحتاج تدخل فوري!</h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{urgentList.length}</span>
            </div>
            <div className="space-y-2">
              {urgentList.slice(0, 2).map(report => (
                <Link key={report.id} to={`/reports/${report.id}`} className="flex items-center gap-3 bg-white rounded-lg p-3 hover:bg-red-50 transition-colors">
                  <span className="text-lg">{CATEGORY_ICONS[report.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{report.title}</p>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[report.category]}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium shrink-0">
                    {report.status === 'new' ? 'ينتظر متطوع' : 'قيد التنفيذ'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">آخر البلاغات</h2>
              <Link to="/reports" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                عرض الكل
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentReports.map(report => (
                <ReportMiniCard key={report.id} report={report} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4">إحصائيات الأسبوع</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#10b981" name="بلاغات" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#6ee7b7" name="تم الحل" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Volunteers */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">أفضل المتطوعين</h3>
                <Link to="/volunteers" className="text-xs text-emerald-600 font-medium">عرض الكل</Link>
              </div>
              <div className="space-y-3">
                {volunteers.slice(0, 3).map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-lg">{v.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.points} نقطة</p>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`text-xs ${s <= Math.round(v.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4">توزيع البلاغات</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {categoryDistribution.slice(0, 6).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                    <span className="text-gray-600 truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
