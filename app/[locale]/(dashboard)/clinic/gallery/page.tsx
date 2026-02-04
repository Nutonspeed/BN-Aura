'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Grid, List, Filter, Eye, Share2, Trash2 } from 'lucide-react';

interface Photo {
  id: string;
  photo_url: string;
  thumbnail_url?: string;
  type: 'before' | 'after' | 'progress';
  taken_at: string;
  notes?: string;
  customer?: { id: string; full_name: string };
  treatment?: { id: string; names: { th: string; en: string } };
  customer_consent: boolean;
  public_gallery_consent: boolean;
}

interface Comparison {
  id: string;
  title?: string;
  description?: string;
  treatment_name?: string;
  is_public: boolean;
  featured: boolean;
  view_count: number;
  before_photo: Photo;
  after_photo: Photo;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'comparisons'>('comparisons');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | 'before' | 'after' | 'progress'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gallery');
      const data = await res.json();
      setPhotos(data.photos || []);
      setComparisons(data.comparisons || []);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredPhotos = typeFilter === 'all' 
    ? photos 
    : photos.filter(p => p.type === typeFilter);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-indigo-600" />
            Before/After Gallery
          </h1>
          <p className="text-gray-600">จัดการภาพผลลัพธ์การรักษา</p>
        </div>
        <button
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          อัพโหลดภาพ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">ภาพทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">Before/After Pairs</p>
          <p className="text-2xl font-bold text-indigo-600">{comparisons.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">Public Gallery</p>
          <p className="text-2xl font-bold text-green-600">
            {comparisons.filter(c => c.is_public).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-2xl font-bold text-purple-600">
            {comparisons.reduce((sum, c) => sum + c.view_count, 0)}
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-4 border-b w-full md:w-auto">
          <button
            onClick={() => setActiveTab('comparisons')}
            className={`pb-3 px-1 font-medium ${
              activeTab === 'comparisons'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Before/After
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-3 px-1 font-medium ${
              activeTab === 'photos'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ภาพทั้งหมด
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'photos' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="before">Before</option>
                <option value="after">After</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          )}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : activeTab === 'comparisons' ? (
        comparisons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีภาพ Before/After</p>
            <p className="text-sm text-gray-400 mt-1">อัพโหลดภาพและสร้าง comparison</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {comparisons.map((comparison) => (
              <div
                key={comparison.id}
                className="bg-white rounded-xl border overflow-hidden group"
              >
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-square">
                      <img
                        src={comparison.before_photo?.thumbnail_url || comparison.before_photo?.photo_url || '/placeholder.jpg'}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </span>
                    </div>
                    <div className="relative aspect-square">
                      <img
                        src={comparison.after_photo?.thumbnail_url || comparison.after_photo?.photo_url || '/placeholder.jpg'}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                        After
                      </span>
                    </div>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                      <Eye className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                      <Share2 className="w-5 h-5 text-gray-700" />
                    </button>
                    <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-gray-900">
                    {comparison.title || comparison.treatment_name || 'Untitled'}
                  </h3>
                  {comparison.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {comparison.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Eye className="w-4 h-4" />
                      {comparison.view_count} views
                    </div>
                    <div className="flex items-center gap-2">
                      {comparison.featured && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        comparison.is_public
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {comparison.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredPhotos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีภาพ</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
            : 'space-y-3'
          }>
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className={viewMode === 'grid'
                  ? 'relative aspect-square rounded-lg overflow-hidden group cursor-pointer'
                  : 'flex items-center gap-4 p-3 bg-white rounded-lg border'
                }
              >
                {viewMode === 'grid' ? (
                  <>
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt={photo.type}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded ${
                      photo.type === 'before' ? 'bg-gray-800 text-white' :
                      photo.type === 'after' ? 'bg-indigo-600 text-white' :
                      'bg-yellow-500 text-white'
                    }`}>
                      {photo.type}
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt={photo.type}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {photo.customer?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {photo.treatment?.names?.th || 'No treatment'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(photo.taken_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      photo.type === 'before' ? 'bg-gray-100 text-gray-700' :
                      photo.type === 'after' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {photo.type}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
