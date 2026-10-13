import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Award, Edit3, Calendar,
  FileText, CheckCircle2, Heart, Mail,
  BarChart3, Zap
} from 'lucide-react';
import { useApp } from '../context';
import { CATEGORY_LABELS, CATEGORY_ICONS, STATUS_COLORS, STATUS_LABELS } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfilePage() {
  const { currentUser, reports } = useApp();
  const [activeTab, setActiveTab] = useState<'reports' | 'activity' | 'badges'>('reports');

  const myReports = reports.filter(r => r.reportedBy === currentUser.id);

  const activityData = [
    { day: 'السبت', count: 3 },
    { day: 'الأحد', count: 5 },
    { day: 'الاثنين', count: 2 },
    { day: 'الثلاثاء', count: 7 },
    { day: 'الأربعاء', count: 4 },
    { day: 'الخميس', count: 6 },
    { day: 'الجمعة', count: 1 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-bl from-emerald-600 to-emerald-800 rounded-3xl overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />
        </div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl border-4 border-white/30 shadow-xl">
              {currentUser.avatar}
            </div>
            <div className="text-center sm:text-right flex-1">
              <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
              <p className="text-emerald-200 text-sm mt-1">{currentUser.bio}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {currentUser.email}
                </span>
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  انضم {currentUser.joinedAt ? new Date(currentUser.joinedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }) : 'مؤخراً'}
                </span>
                <span className="bg-amber-500/80 px-3 py-1 rounded-full text-xs text-white flex items-center gap-1 font-bold">
                  <Star className="w-3 h-3 fill-white" />
                  {currentUser.points} نقطة
                </span>
              </div>
            </div>
            <button className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-sm font-medium hover:bg-white/25 transition-colors flex items-center gap-2 border border-white/20">
              <Edit3 className="w-4 h-4" />
              تعديل
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-800">{currentUser.reportsCount}</p>
          <p className="text-xs text-gray-500">بلاغاتي</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-800">{currentUser.resolvedCount}</p>
          <p className="text-xs text-gray-500">تم حلها</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-800">{currentUser.rating}</p>
          <p className="text-xs text-gray-500">التقييم</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-800">{currentUser.badges.length}</p>
          <p className="text-xs text-gray-500">شارات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'reports' as const, label: 'بلاغاتي', icon: FileText },
            { key: 'activity' as const, label: 'النشاط', icon: BarChart3 },
            { key: 'badges' as const, label: 'الشارات', icon: Award },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* My Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              {myReports.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-3">📋</span>
                  <p className="text-gray-500 text-sm">لا توجد بلاغات بعد</p>
                  <Link to="/reports/new" className="text-emerald-600 text-sm font-medium mt-2 inline-block">
                    قدّم أول بلاغ
                  </Link>
                </div>
              ) : (
                myReports.map(report => (
                  <Link key={report.id} to={`/reports/${report.id}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-xl">{CATEGORY_ICONS[report.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{report.title}</p>
                      <p className="text-xs text-gray-400">{CATEGORY_LABELS[report.category]}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">نشاطك هذا الأسبوع</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="المساهمات" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 mb-2">آخر النشاطات</h3>
                {[
                  { text: 'تم حل بلاغ "تراكم النفايات"', time: 'منذ ساعتين', icon: CheckCircle2, color: 'text-green-500' },
                  { text: 'تم تبني بلاغ "حفرة في الشارع"', time: 'منذ 5 ساعات', icon: Heart, color: 'text-red-500' },
                  { text: 'حصلت على شارة "مراقب البيئة" 🌿', time: 'أمس', icon: Award, color: 'text-purple-500' },
                  { text: 'أضفت تعليقاً على بلاغ', time: 'منذ يومين', icon: Zap, color: 'text-blue-500' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="text-[10px] text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">حصلت على {currentUser.badges.length} شارة من أصل 6</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'متطوع متميز', icon: '🏆', earned: currentUser.badges.some(b => b.name === 'متطوع متميز') },
                  { name: 'استجابة سريعة', icon: '⚡', earned: currentUser.badges.some(b => b.name === 'استجابة سريعة') },
                  { name: 'خبير حلول', icon: '🧠', earned: currentUser.badges.some(b => b.name === 'خبير حلول') },
                  { name: 'صاحب قلب', icon: '❤️', earned: currentUser.badges.some(b => b.name === 'صاحب قلب') },
                  { name: 'مراقب البيئة', icon: '🌿', earned: currentUser.badges.some(b => b.name === 'مراقب البيئة') },
                  { name: 'بطل الحي', icon: '🏘️', earned: currentUser.badges.some(b => b.name === 'بطل الحي') },
                ].map((badge, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 text-center transition-all ${
                      badge.earned
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-sm'
                        : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                    }`}
                  >
                    <span className={`text-3xl block mb-2 ${!badge.earned ? 'grayscale' : ''}`}>{badge.icon}</span>
                    <p className="text-xs font-bold text-gray-700">{badge.name}</p>
                    {badge.earned ? (
                      <span className="text-[10px] text-green-600 font-medium mt-1 block">✓ تم الحصول</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 mt-1 block">مقفل</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
