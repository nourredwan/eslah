import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid3X3, List, MapPin, Clock, ThumbsUp,
  ChevronLeft, Search, SlidersHorizontal, X
} from 'lucide-react';
import { useApp } from '../context';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_COLORS, PRIORITY_LABELS,
  STATUS_COLORS, STATUS_LABELS, ReportCategory, ReportStatus, ReportPriority
} from '../types';

export default function ReportsPage() {
  const { reports } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ReportCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<ReportPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'priority'>('newest');

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.includes(q) || r.description.includes(q) || r.location.address.includes(q)
      );
    }
    if (filterCategory !== 'all') result = result.filter(r => r.category === filterCategory);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);
    if (filterPriority !== 'all') result = result.filter(r => r.priority === filterPriority);

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'upvotes':
        result.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, medium: 1, low: 2 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }

    return result;
  }, [reports, searchQuery, filterCategory, filterStatus, filterPriority, sortBy]);

  const activeFilterCount = [filterCategory, filterStatus, filterPriority].filter(f => f !== 'all').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">البلاغات</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredReports.length} بلاغ</p>
        </div>
        <Link
          to="/reports/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
        >
          + بلاغ جديد
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في البلاغات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              فلترة
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'upvotes' | 'priority')}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">الأحدث</option>
              <option value="upvotes">الأكثر تأييداً</option>
              <option value="priority">حسب الأولوية</option>
            </select>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">التصنيف</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as ReportCategory | 'all')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">جميع التصنيفات</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{CATEGORY_ICONS[key as ReportCategory]} {label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">الحالة</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">جميع الحالات</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">الأولوية</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as ReportPriority | 'all')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">جميع الأولويات</option>
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterCategory('all'); setFilterStatus('all'); setFilterPriority('all'); }}
                className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reports Grid/List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">📭</span>
          <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد بلاغات</h3>
          <p className="text-sm text-gray-400">جرب تغيير معايير البحث أو الفلترة</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group"
            >
              {/* Top color bar */}
              <div className={`h-1.5 ${
                report.priority === 'urgent' ? 'bg-red-500' :
                report.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
              }`} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                    {PRIORITY_LABELS[report.priority]}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xl shrink-0">{CATEGORY_ICONS[report.category]}</span>
                  <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{report.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{report.location.address.split('،')[1]?.trim() || report.location.address}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {report.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                {report.adoptedByName && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span className="text-xs text-emerald-600 font-medium">{report.adoptedByName}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <span className="text-2xl">{CATEGORY_ICONS[report.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 transition-colors truncate">
                    {report.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[report.priority]}`}>
                    {PRIORITY_LABELS[report.priority]}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{CATEGORY_LABELS[report.category]}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {report.location.address.split('،')[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(report.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {report.upvotes}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
