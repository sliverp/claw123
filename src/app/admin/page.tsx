'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminReview {
  id: number;
  claw_id: number;
  nickname: string;
  rating: number;
  content: string;
  ip: string;
  fingerprint: string;
  approved: number;
  created_at: string;
  claw_name: string;
  claw_slug: string;
}

type TabStatus = 'pending' | 'approved' | 'rejected';

interface SiteAnalytics {
  total_pv: number;
  total_uv: number;
  today_pv: number;
  today_uv: number;
  top_pages: Array<{ path: string; pv: number; uv: number }>;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [analytics, setAnalytics] = useState<SiteAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabStatus>('pending');
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${tab}`, {
        headers: { 'x-admin-token': token },
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setReviews(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'x-admin-token': token },
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (authed) {
      fetchReviews();
      fetchAnalytics();
    }
  }, [authed, tab, fetchReviews, fetchAnalytics]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) setAuthed(true);
  };

  const handleAction = async (reviewId: number, action: 'approve' | 'reject') => {
    setActionLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  // 登录界面
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-slate-800 mb-1">🔒 管理后台</h1>
          <p className="text-sm text-slate-400 mb-6">输入管理员 Token 登录</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin Token"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            登录
          </button>
        </form>
      </div>
    );
  }

  const tabs: { key: TabStatus; label: string; color: string }[] = [
    { key: 'pending', label: '待审核', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'approved', label: '已通过', color: 'text-green-600 bg-green-50 border-green-200' },
    { key: 'rejected', label: '已拒绝', color: 'text-red-600 bg-red-50 border-red-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-lg">
              🐾 Claw123
            </a>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">评论审核</span>
          </div>
          <button
            onClick={() => { setAuthed(false); setToken(''); }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            退出
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-400">总 PV</div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{analytics.total_pv}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-400">总 UV</div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{analytics.total_uv}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-400">今日 PV</div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{analytics.today_pv}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-400">今日 UV</div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{analytics.today_uv}</div>
            </div>
          </div>
        )}

        {analytics && analytics.top_pages.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">热门页面</h2>
            </div>
            <div className="space-y-3">
              {analytics.top_pages.slice(0, 5).map((page) => (
                <div key={page.path} className="flex items-center justify-between gap-4 text-sm">
                  <div className="truncate text-slate-600">{page.path}</div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-slate-400">
                    <span>PV {page.pv}</span>
                    <span>UV {page.uv}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div className="flex items-center gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                tab === t.key
                  ? t.color
                  : 'text-slate-400 bg-white border-slate-200 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => {
              fetchReviews();
              fetchAnalytics();
            }}
            className="ml-auto px-3 py-2 text-sm text-slate-400 hover:text-blue-600 transition-colors"
          >
            ↻ 刷新
          </button>
        </div>

        {/* 评论列表 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-slate-400">暂无{tabs.find((t) => t.key === tab)?.label}评论</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 项目名称 + 评分 */}
                    <div className="flex items-center gap-3 mb-2">
                      <a
                        href={`/claw/${review.claw_slug}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {review.claw_name}
                      </a>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={`text-sm ${i <= review.rating ? 'text-amber-400' : 'text-slate-200'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 用户信息 */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span className="font-medium text-slate-600">{review.nickname}</span>
                      <span>·</span>
                      <span>IP: {review.ip}</span>
                      <span>·</span>
                      <span>{new Date(review.created_at).toLocaleString('zh-CN')}</span>
                    </div>

                    {/* 评价内容 */}
                    <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
                  </div>

                  {/* 操作按钮 */}
                  {tab === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(review.id, 'approve')}
                        disabled={actionLoading[review.id]}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium
                                   hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        ✓ 通过
                      </button>
                      <button
                        onClick={() => handleAction(review.id, 'reject')}
                        disabled={actionLoading[review.id]}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium
                                   hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        ✕ 拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
