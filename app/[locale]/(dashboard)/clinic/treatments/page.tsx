'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { 
  Heart,
  Sparkle,
  Clock,
  CheckCircle,
  Plus,
  Pencil,
  Trash,
  X,
  CurrencyDollar,
  Timer,
  Users
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export default function TreatmentsManagement() {
  const { getClinicId } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'facial',
    duration: 60,
    price: 0,
    is_active: true
  });
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    pending: 0,
    popular: '-'
  });

  const clinicId = getClinicId();

  useEffect(() => {
    fetchTreatments();
  }, [clinicId]);

  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/treatments?activeOnly=false');
      const data = await res.json();
      if (data.success) {
        setTreatments(data.treatments || []);
        // Calculate stats
        const active = data.treatments?.filter((t: Treatment) => t.is_active).length || 0;
        setStats({
          active,
          completed: Math.floor(active * 0.7), // Mock completed based on active
          pending: Math.floor(active * 0.3), // Mock pending
          popular: data.treatments?.length ? data.treatments[0].name : '-'
        });
      }
    } catch (e) {
      console.error('Failed to fetch treatments:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTreatment ? `/api/treatments/${editingTreatment.id}` : '/api/treatments';
    const method = editingTreatment ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchTreatments();
        setShowForm(false);
        setEditingTreatment(null);
        setFormData({
          name: '',
          description: '',
          category: 'facial',
          duration: 60,
          price: 0,
          is_active: true
        });
      }
    } catch (e) {
      console.error('Failed to save treatment:', e);
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      name: treatment.name,
      description: treatment.description,
      category: treatment.category,
      duration: treatment.duration,
      price: treatment.price,
      is_active: treatment.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this treatment?')) return;
    
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTreatments();
      }
    } catch (e) {
      console.error('Failed to delete treatment:', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Heart weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Treatments Management</h1>
            <p className="text-sm text-muted-foreground">Service Protocol Center</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus weight="bold" />
          Add Treatment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Active Treatments</p>
              <p className="text-2xl font-black mt-1">{stats.active}</p>
            </div>
            <Heart weight="duotone" className="w-8 h-8 text-pink-500" />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Completed</p>
              <p className="text-2xl font-black mt-1">{stats.completed}</p>
            </div>
            <CheckCircle weight="duotone" className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black mt-1">{stats.pending}</p>
            </div>
            <Clock weight="duotone" className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Popular</p>
              <p className="text-lg font-black mt-1 truncate">{stats.popular}</p>
            </div>
            <Sparkle weight="duotone" className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Treatments List */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase">Treatment Protocols</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No treatments found</p>
              <p className="text-sm mt-2">Add your first treatment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <motion.div
                  key={treatment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{treatment.name}</h3>
                      <Badge variant={treatment.is_active ? 'default' : 'secondary'}>
                        {treatment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{treatment.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{treatment.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Timer weight="duotone" className="w-4 h-4" />
                        {treatment.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollar weight="duotone" className="w-4 h-4" />
                        ฿{treatment.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(treatment)}
                    >
                      <Pencil weight="duotone" className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(treatment.id)}
                    >
                      <Trash weight="duotone" className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingTreatment ? 'Edit Treatment' : 'Add Treatment'}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  <X weight="bold" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="facial">Facial</option>
                    <option value="body">Body</option>
                    <option value="laser">Laser</option>
                    <option value="injection">Injection</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (min)</label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="300"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price (฿)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="active" className="text-sm">Active</label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingTreatment ? 'Update' : 'Create'} Treatment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
