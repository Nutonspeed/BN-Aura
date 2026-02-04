'use client';

import { useState, useEffect } from 'react';
import { Star, ChatCircle, ThumbsUp, Funnel } from '@phosphor-icons/react';

interface Review {
  id: string;
  customer?: { full_name: string };
  rating: number;
  review_text: string;
  response_text?: string;
  platform: string;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [responding, setResponding] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('rating', filter);
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats({ totalReviews: data.totalReviews, avgRating: data.avgRating, ratingCounts: data.ratingCounts });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const submitResponse = async (reviewId: string) => {
    if (!response.trim()) return;
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, responseText: response })
    });
    setResponding(null);
    setResponse('');
    fetchData();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-7 h-7 text-yellow-500" /> Reviews & Reputation
        </h1>
        <p className="text-gray-600">จัดการรีวิวและชื่อเสียงออนไลน์</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border col-span-1">
          <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} รีวิว</p>
        </div>
        <div className="bg-white rounded-xl p-4 border col-span-3">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-3 text-sm">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400"
                    style={{ width: `${stats.totalReviews ? (stats.ratingCounts[rating as keyof typeof stats.ratingCounts] / stats.totalReviews) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-sm text-gray-500 text-right">{stats.ratingCounts[rating as keyof typeof stats.ratingCounts]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-lg text-sm ${!filter ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
          ทั้งหมด
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setFilter(r.toString())} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === r.toString() ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            {r} <Star className="w-3 h-3" />
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <ChatCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีรีวิว</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{review.customer?.full_name || 'ลูกค้า'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{review.platform}</span>
                  </div>
                </div>
              </div>
              {review.review_text && <p className="text-gray-700 mt-2">{review.review_text}</p>}
              
              {review.response_text ? (
                <div className="mt-3 pl-4 border-l-2 border-indigo-200">
                  <p className="text-sm text-gray-600"><span className="font-medium">ตอบกลับ:</span> {review.response_text}</p>
                </div>
              ) : responding === review.id ? (
                <div className="mt-3">
                  <textarea
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="พิมพ์ข้อความตอบกลับ..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => submitResponse(review.id)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">ส่ง</button>
                    <button onClick={() => setResponding(null)} className="px-3 py-1 bg-gray-100 rounded text-sm">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setResponding(review.id)} className="mt-3 text-sm text-indigo-600 hover:underline">
                  ตอบกลับ
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
