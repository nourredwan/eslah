import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, FileText, CheckCircle2, AlertTriangle,
  Eye, Trash2, Shield, Download, RefreshCw
} from 'lucide-react';
import { useApp } from '../context';
import { api } from '../services/api';
import { User } from '../types';
import { CATEGORY_LABELS, CATEGORY_ICONS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

export default function AdminPage() {
  const { reports, refreshReports } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.users.getVolunteers({ role: 'all' });
      setUsers(data);
    } catch (error) {
      console.error('تعذر تحميل المستخدمين:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshReports();
      await fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reports, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", jsonStr);
    dlAnchorElem.setAttribute("download", `reports_export_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
      try {
        await api.reports.delete(id);
        await refreshReports();
      } catch (err: any) {
        alert(err.message || 'فشل حذف البلاغ');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await api.users.delete(id);
        await fetchUsers();
      } catch (err: any) {
        alert(err.message || 'فشل حذف المستخدم');
      }
    }
  };

  const [activeSection, setActiveSection] = useState<'overview' | 'reports' | 'users'>('overview');

  const totalReports = reports.length;
  const newReports = reports.filter(r => r.status === 'new').length;
  const inProgress = reports.filter(r => r.status === 'in_progress').length;
  const completed = reports.filter(r => r.status === 'completed').length;
  const weeklyTrend = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - offset));
    const items = reports.filter(report => new Date(report.createdAt).toDateString() === day.toDateString());
    return { day: day.toLocaleDateString('ar-SA', { weekday: 'long' }), reports: items.length, resolved: items.filter(report => report.status === 'completed').length };
  });
  const colors = ['#f97316', '#eab308', '#3b82f6', '#ef4444', '#ec4899', '#22c55e', '#a855f7', '#6b7280'];
  const categoryDistribution = Object.entries(CATEGORY_LABELS).map(([category, name], index) => ({ name, value: reports.filter(report => report.category === category).length, fill: colors[index] }));
  const areaCounts = reports.reduce<Record<string, number>>((result, report) => {
    const area = report.location.address.split('،')[0] || 'غير محدد'; result[area] = (result[area] || 0) + 1; return result;
  }, {});
  const areaDistribution = Object.entries(areaCounts).map(([name, issues]) => ({ name, issues }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المدير</h1>
            <p className="text-sm text-gray-500">إدارة ومتابعة المنصة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            تقرير
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200">
        {([
          { key: 'overview' as const, label: 'نظرة عامة', icon: BarChart3 },
          { key: 'reports' as const, label: 'إدارة البلاغات', icon: FileText },
          { key: 'users' as const, label: 'المستخدمين', icon: Users },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === tab.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-green-500 font-medium">+12%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalReports}</p>
              <p className="text-xs text-gray-500">إجمالي البلاغات</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-red-500 font-medium">عاجل</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{newReports}</p>
              <p className="text-xs text-gray-500">بلاغات جديدة</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <RefreshCw className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{inProgress}</p>
              <p className="text-xs text-gray-500">قيد التنفيذ</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">{totalReports > 0 ? Math.round((completed / totalReports) * 100) : 0}%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{completed}</p>
              <p className="text-xs text-gray-500">تم الحل</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              <p className="text-xs text-gray-500">مستخدمين</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Trend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4">اتجاه البلاغات الأسبوعي</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reports" stroke="#10b981" name="بلاغات" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="resolved" stroke="#6ee7b7" name="تم الحل" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4">توزيع التصنيفات</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Analysis */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">المناطق الأكثر تضرراً</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={areaDistribution} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="issues" fill="#ef4444" name="عدد المشاكل" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reports Management Section */}
      {activeSection === 'reports' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">إدارة البلاغات</h3>
            <span className="text-xs text-gray-400">{reports.length} بلاغ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">البلاغ</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">التصنيف</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الأولوية</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الحالة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">التأييدات</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[report.category]}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{report.title}</p>
                          <p className="text-[10px] text-gray-400">{new Date(report.createdAt).toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{CATEGORY_LABELS[report.category]}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                        {PRIORITY_LABELS[report.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{report.upvotes}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/reports/${report.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg inline-block" title="عرض">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Management Section */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">إدارة المستخدمين</h3>
            <span className="text-xs text-gray-400">{users.length} مستخدم</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المستخدم</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الدور</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">النقاط</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">التقييم</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">البلاغات</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{user.avatar}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-[10px] text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        user.role === 'volunteer' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'organization' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'volunteer' ? 'متطوع' : user.role === 'organization' ? 'مؤسسة' : user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.points}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.rating} ⭐</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.reportsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
