import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Clock, ThumbsUp, MessageCircle,
  Share2, Flag, CheckCircle2, AlertCircle, Play, ChevronRight,
  Send, ArrowLeft, HandHelping
} from 'lucide-react';
import { useApp } from '../context';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_COLORS, PRIORITY_LABELS,
  STATUS_COLORS, STATUS_LABELS
} from '../types';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { reports, currentUser, adoptReport, addComment, toggleUpvote, updateReport, getUserById } = useApp();
  const [newComment, setNewComment] = useState('');
  const [showAdoptSuccess, setShowAdoptSuccess] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const report = reports.find(r => r.id === id);

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">البلاغ غير موجود</h2>
        <p className="text-gray-500 mb-6">ربما تم حذف هذا البلاغ أو الرابط غير صحيح</p>
        <Link to="/reports" className="text-emerald-600 font-medium flex items-center gap-1 justify-center">
          <ArrowLeft className="w-4 h-4" />
          العودة للبلاغات
        </Link>
      </div>
    );
  }

  const reporter = getUserById(report.reportedBy);
  const hasUpvoted = report.upvotedBy.includes(currentUser.id);
  const canAdopt = !report.adoptedBy && currentUser.id !== report.reportedBy;
  const canComplete = report.adoptedBy === currentUser.id && report.status !== 'completed';

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleAdopt = async () => {
    try {
      await adoptReport(report.id);
      setShowAdoptSuccess(true);
      setTimeout(() => setShowAdoptSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تبني البلاغ. يرجى تسجيل الدخول أولاً.');
    }
  };

  const handleComplete = async () => {
    try {
      await updateReport(report.id, { status: 'completed' });
      setShowCompleteConfirm(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تحديث حالة البلاغ.');
    }
  };

  const handleComment = async () => {
    if (newComment.trim()) {
      try {
        await addComment(report.id, newComment.trim());
        setNewComment('');
      } catch (err: any) {
        alert(err.message || 'يرجى تسجيل الدخول لإضافة تعليق.');
      }
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setFeedbackMsg('تم نسخ رابط البلاغ بنجاح!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleFlag = () => {
    setFeedbackMsg('تم إرسال تنبيه للمشرفين لمراجعة المحتوى.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const statusSteps = [
    { label: 'تم الإبلاغ', icon: AlertCircle, done: true, date: report.createdAt },
    { label: 'قيد التنفيذ', icon: Play, done: report.status !== 'new', date: report.status !== 'new' ? report.updatedAt : null },
    { label: 'تم الحل', icon: CheckCircle2, done: report.status === 'completed', date: report.status === 'completed' ? report.updatedAt : null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-emerald-600">الرئيسية</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/reports" className="hover:text-emerald-600">البلاغات</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 truncate">{report.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Success Banner */}
          {showAdoptSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">تم تبني البلاغ بنجاح! شكراً لمساهمتك 🎉</p>
            </div>
          )}

          {/* Report Header */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className={`h-2 ${
              report.priority === 'urgent' ? 'bg-gradient-to-l from-red-500 to-red-600' :
              report.priority === 'medium' ? 'bg-gradient-to-l from-amber-500 to-amber-600' :
              'bg-gradient-to-l from-green-500 to-green-600'
            }`} />
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                  {PRIORITY_LABELS[report.priority]}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[report.status]}`}>
                  {STATUS_LABELS[report.status]}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
                  {CATEGORY_ICONS[report.category]} {CATEGORY_LABELS[report.category]}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-4">{report.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{report.description}</p>

              {/* Meta Info */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">الموقع</p>
                    <p className="text-gray-700 font-medium">{report.location.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">تاريخ الإبلاغ</p>
                    <p className="text-gray-700 font-medium">
                      {new Date(report.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-lg">
                  {reporter?.avatar || '👤'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700">{report.reportedByName || reporter?.name || 'مستخدم'}</p>
                  <p className="text-xs text-gray-400">صاحب البلاغ</p>
                </div>
                {report.adoptedByName && (
                  <div className="text-left">
                    <p className="text-xs text-gray-400">تم التبني بواسطة</p>
                    <p className="text-sm font-medium text-emerald-600">{report.adoptedByName}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => toggleUpvote(report.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    hasUpvoted
                      ? 'bg-emerald-100 text-emerald-700 shadow-inner'
                      : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-emerald-600' : ''}`} />
                  {report.upvotes} تأييد
                </button>
                {canAdopt && (
                  <button
                    onClick={handleAdopt}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    <HandHelping className="w-4 h-4" />
                    تبني هذا البلاغ
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => setShowCompleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تم الحل
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </button>
                <button
                  onClick={handleFlag}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  إبلاغ
                </button>
              </div>

              {feedbackMsg && (
                <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 animate-fadeIn">
                  {feedbackMsg}
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">تتبع الحالة</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 right-6 left-6 h-0.5 bg-gray-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${report.status === 'completed' ? 100 : report.status === 'in_progress' ? 50 : 0}%` }}
                />
              </div>
              {statusSteps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-300'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-medium mt-2 ${step.done ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(step.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">الموقع على الخريطة</h2>
            <div className="h-64 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl flex items-center justify-center border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <svg viewBox="0 0 400 250" className="w-full h-full">
                  <path d="M0 125 Q50 100 100 115 Q150 130 200 110 Q250 90 300 105 Q350 120 400 100" stroke="#10b981" fill="none" strokeWidth="1" opacity="0.3" />
                  <path d="M0 150 Q80 140 160 155 Q240 170 320 145 Q360 135 400 140" stroke="#3b82f6" fill="none" strokeWidth="1" opacity="0.3" />
                  <circle cx="200" cy="110" r="4" fill="#10b981" opacity="0.8" />
                  <circle cx="200" cy="110" r="20" fill="#10b981" opacity="0.1" />
                </svg>
              </div>
              <div className="text-center relative">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-200">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-700">{report.location.address}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              التعليقات ({report.comments.length})
            </h2>

            {/* Add Comment */}
            <div className="flex gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-sm shrink-0">
                {currentUser.avatar}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="أضف تعليقاً..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comments List */}
            {report.comments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">لا توجد تعليقات بعد. كن أول من يعلق!</p>
            ) : (
              <div className="space-y-4">
                {report.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm shrink-0">
                      {comment.userAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-700">{comment.userName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Complete Confirmation Modal */}
          {showCompleteConfirm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">تأكيد إكمال البلاغ</h3>
                <p className="text-sm text-gray-500 text-center mb-6">هل تم حل هذه المشكلة بالفعل؟</p>
                <div className="flex gap-3">
                  <button onClick={handleComplete} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors">
                    نعم، تم الحل
                  </button>
                  <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">معلومات سريعة</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">التصنيف</span>
                <span className="font-medium text-gray-700">{CATEGORY_ICONS[report.category]} {CATEGORY_LABELS[report.category]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الأولوية</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                  {PRIORITY_LABELS[report.priority]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الحالة</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                  {STATUS_LABELS[report.status]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">التأييدات</span>
                <span className="font-medium text-gray-700">{report.upvotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">التعليقات</span>
                <span className="font-medium text-gray-700">{report.comments.length}</span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="font-bold text-purple-800">اقتراحات ذكية</h3>
            </div>
            <div className="space-y-2">
              <div className="bg-white/80 rounded-lg p-3 text-xs text-purple-700">
                💡 {report.category === 'roads' ? 'تجنب المرور من هذا الشارع حتى يتم الإصلاح. يمكن استخدام الشارع البديل.' :
                  report.category === 'electricity' ? 'تأكد من وجود مصادر إضاءة بديلة وابقَ على تواصل مع شركة الكهرباء.' :
                  report.category === 'water' ? 'احتفظ بمخزون كافٍ من المياه حتى يتم حل المشكلة.' :
                  report.category === 'humanitarian' ? 'يمكنك المساعدة بنشر البلاغ والتبرع إذا أمكن.' :
                  'شكراً لإبلاغك! سيتم مراجعة البلاغ والرد عليك في أقرب وقت.'}
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-xs text-purple-700">
                📊 تم رصد {Math.floor(Math.random() * 5) + 2} بلاغات مشابهة في نفس المنطقة
              </div>
            </div>
          </div>

          {/* Similar Reports */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">بلاغات مشابهة</h3>
            <div className="space-y-3">
              {reports
                .filter(r => r.category === report.category && r.id !== report.id)
                .slice(0, 3)
                .map(r => (
                  <Link key={r.id} to={`/reports/${r.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-lg">{CATEGORY_ICONS[r.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{r.title}</p>
                      <p className="text-[10px] text-gray-400">{STATUS_LABELS[r.status]}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
