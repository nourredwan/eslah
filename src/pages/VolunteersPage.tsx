import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export default function VolunteersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'volunteer' | 'organization'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [badges, setBadges] = useState<User['badges']>([]);

  useEffect(() => {
    api.users.getVolunteers().then((items) => {
      setUsers(items);
      setBadges(Array.from(new Map(items.flatMap(user => user.badges).map(badge => [badge.id, badge])).values()));
    }).catch(error => console.error('تعذر تحميل المتطوعين:', error));
  }, []);

  const filteredUsers = users
    .filter(u => u.role !== 'admin')
    .filter(u => {
      if (filterRole === 'volunteer') return u.role === 'volunteer';
      if (filterRole === 'organization') return u.role === 'organization';
      return true;
    })
    .filter(u => u.name.includes(searchQuery) || (u.bio && u.bio.includes(searchQuery)))
    .sort((a, b) => b.points - a.points);

  const topThree = filteredUsers.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 لوحة الشرف</h1>
        <p className="text-gray-500">أفضل المتطوعين والمؤسسات المساهمة في خدمة المجتمع</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن متطوع أو مؤسسة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'volunteer', 'organization'] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                filterRole === role
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {role === 'all' ? 'الكل' : role === 'volunteer' ? 'متطوعين' : 'مؤسسات'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-3xl p-8 border border-emerald-100">
          <div className="flex items-end justify-center gap-4 sm:gap-8">
            {/* Second Place */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-3 border-4 border-gray-300 shadow-lg">
                {topThree[1].avatar}
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-base">{topThree[1].name}</p>
              <p className="text-xs text-gray-500">{topThree[1].points} نقطة</p>
              <div className="mt-2 bg-gray-200 rounded-t-xl h-24 sm:h-28 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-500">2</span>
                <span className="text-xs text-gray-400">🥈</span>
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl mx-auto mb-3 border-4 border-amber-400 shadow-xl">
                  {topThree[0].avatar}
                </div>
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-base">{topThree[0].name}</p>
              <p className="text-xs text-amber-600 font-bold">{topThree[0].points} نقطة</p>
              <div className="mt-2 bg-amber-200 rounded-t-xl h-32 sm:h-36 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-amber-600">1</span>
                <span className="text-xs text-amber-500">🥇</span>
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-3 border-4 border-amber-600 shadow-lg">
                {topThree[2].avatar}
              </div>
              <p className="font-bold text-gray-800 text-sm sm:text-base">{topThree[2].name}</p>
              <p className="text-xs text-gray-500">{topThree[2].points} نقطة</p>
              <div className="mt-2 bg-amber-100 rounded-t-xl h-20 sm:h-24 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-amber-700">3</span>
                <span className="text-xs text-amber-500">🥉</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">الترتيب العام</h2>
          <span className="text-xs text-gray-400">{filteredUsers.length} مشارك</span>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredUsers.map((user, index) => (
            <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              {/* Rank */}
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                index === 0 ? 'bg-yellow-500 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-500'
              }`}>
                {index + 1}
              </span>

              {/* Avatar */}
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {user.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 text-sm truncate">{user.name}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    user.role === 'volunteer' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'organization' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'volunteer' ? 'متطوع' : user.role === 'organization' ? 'مؤسسة' : 'مستخدم'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{user.bio}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">{user.resolvedCount} بلاغ محلول</span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(user.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </span>
                </div>
              </div>

              {/* Points */}
              <div className="text-left shrink-0">
                <p className="text-lg font-bold text-emerald-600">{user.points}</p>
                <p className="text-[10px] text-gray-400">نقطة</p>
              </div>

              {/* Badges */}
              <div className="hidden sm:flex gap-1">
                {user.badges.slice(0, 3).map(badge => (
                  <span key={badge.id} className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-sm" title={badge.name}>
                    {badge.icon}
                  </span>
                ))}
                {user.badges.length > 3 && (
                  <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-500">
                    +{user.badges.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">الشارات المتاحة</h2>
        <p className="text-sm text-gray-500 mb-4">احصل على شارات من خلال مساهماتك في المنصة</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map(badge => (
            <div key={badge.id} className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
              <span className="text-3xl block mb-2">{badge.icon}</span>
              <p className="text-xs font-bold text-gray-700">{badge.name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
