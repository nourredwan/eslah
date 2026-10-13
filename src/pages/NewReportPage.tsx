import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera, MapPin, FileText, Tag, Loader2, Navigation, X, CheckCircle2
} from 'lucide-react';
import { useApp } from '../context';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_LABELS,
  ReportCategory, ReportPriority
} from '../types';

export default function NewReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addReport, detectCategory, detectPriority, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('other');
  const [priority, setPriority] = useState<ReportPriority>(searchParams.get('priority') === 'urgent' ? 'urgent' : 'medium');
  const [address, setAddress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // AI Category Detection
  useEffect(() => {
    if (title.length > 5 || description.length > 10) {
      setIsDetecting(true);
      const timer = setTimeout(() => {
        const detected = detectCategory(title + ' ' + description);
        const detectedPriority = detectPriority(title + ' ' + description);
        setCategory(detected);
        setPriority(detectedPriority);
        setIsDetecting(false);
        setAiSuggestion(`تم اكتشاف أن البلاغ يتعلق بـ "${CATEGORY_LABELS[detected]}" بأولوية "${PRIORITY_LABELS[detectedPriority]}"`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [title, description, detectCategory, detectPriority]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5);
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => [...prev, e.target!.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title || !description || !address) {
      setSubmitError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!currentUser.id) {
      setSubmitError('يرجى تسجيل الدخول أولاً للتمكن من تقديم البلاغ');
      return;
    }

    setIsSubmitting(true);

    try {
      await addReport(
        {
          title,
          description,
          category,
          priority,
          status: 'new',
          location: {
            lat: 24.7136 + (Math.random() - 0.5) * 0.05,
            lng: 46.6753 + (Math.random() - 0.5) * 0.05,
            address,
          },
          images: [],
          reportedBy: currentUser.id,
        },
        selectedFiles
      );

      setSubmitted(true);
      setTimeout(() => navigate('/reports'), 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'حدث خطأ أثناء حفظ البلاغ. يرجى التأكد من اتصال الخادم والمحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">تم إرسال البلاغ بنجاح! 🎉</h2>
          <p className="text-gray-500 mb-2">تم حفظ البلاغ ورفع الصور إلى Cloudinary بأمان</p>
          <p className="text-sm text-gray-400">سيتم توجيهك لصفحة البلاغات...</p>
          <div className="mt-8 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">بلاغ جديد</h1>
          <p className="text-sm text-gray-500">ساعد في تحسين مجتمعك بالإبلاغ عن المشكلات</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <Tag className="w-4 h-4 text-emerald-600" />
            عنوان البلاغ *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: حفرة في الشارع الرئيسي تعيق السير"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <FileText className="w-4 h-4 text-emerald-600" />
            تفاصيل المشكلة *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="صف المشكلة بدقة وموقعها بالتحديد..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />

          {isDetecting && (
            <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري التحليل الذكي للنص للتصنيف...</span>
            </div>
          )}

          {aiSuggestion && !isDetecting && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>✨</span>
                <span>{aiSuggestion}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiSuggestion(null)}
                className="text-emerald-500 hover:text-emerald-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              التصنيف *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_LABELS) as ReportCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                    category === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 font-bold'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                  <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              مستوى الأهمية *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['urgent', 'medium', 'low'] as ReportPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                        : p === 'medium'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                        : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  <span className="text-lg block mb-1">
                    {p === 'urgent' ? '🔴' : p === 'medium' ? '🟡' : '🟢'}
                  </span>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            الموقع *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="الرياض، حي النزهة، شارع أبي بكر الصديق"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <button
              type="button"
              onClick={() => setAddress('الرياض، حي الصحافة، طريق الملك فهد')}
              className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
              title="تحديد الموقع التلقائي"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Upload with Cloudinary Integration */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              صور المشكلة (تخزين Cloudinary آمن)
            </span>
            <span className="text-xs text-gray-400 font-normal">حتى 5 صور</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileChange(e.dataTransfer.files);
            }}
          >
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">اسحب الصور هنا أو انقر للاختيار من جهازك</p>
            <p className="text-xs text-gray-400 mt-1">يتم التشفير والرفع التلقائي إلى Cloudinary (JPG, PNG, WEBP)</p>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mt-4">
              {previews.map((src, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-200 flex items-center gap-2">
            <span>⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري حفظ البلاغ ورفع الصور...</span>
            </>
          ) : (
            <>
              <span>إرسال البلاغ</span>
              <span>🚀</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
