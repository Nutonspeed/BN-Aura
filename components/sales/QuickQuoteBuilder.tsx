'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CheckCircle,
  CurrencyDollar,
  Percent,
  Clock,
  Sparkle,
  PaperPlaneTilt,
  Calculator,
  Tag,
  Package,
  Gift,
  Lightning
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TREATMENT_DATABASE } from '@/lib/templates/proposalTemplates';

interface TreatmentItem {
  id: string;
  name: string;
  category: 'filler' | 'laser' | 'facial' | 'skincare';
  basePrice: number;
  sessionsRequired: number;
  duration: string;
  description: string;
  benefits: string[];
}

interface QuoteItem {
  treatment: TreatmentItem;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface QuickQuoteBuilderProps {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  onSuccess?: (proposalId: string) => void;
  onCancel?: () => void;
}

export default function QuickQuoteBuilder({
  customerId,
  customerName,
  customerEmail,
  onSuccess,
  onCancel
}: QuickQuoteBuilderProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [proposalTitle, setProposalTitle] = useState(`ใบเสนอราคาสำหรับ ${customerName}`);
  const [validityDays, setValidityDays] = useState(7);
  const [notes, setNotes] = useState('');

  const supabase = createClient();

  // Filter treatments
  const filteredTreatments = TREATMENT_DATABASE.filter(treatment => {
    const matchesCategory = selectedCategory === 'all' || treatment.category === selectedCategory;
    const matchesSearch = treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.subtotal * item.discount / 100), 0);
  const packageDiscount = items.length > 1 ? Math.floor(subtotal * 0.1) : 0; // 10% package discount for 2+ items
  const total = subtotal - totalDiscount - packageDiscount;

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: Package },
    { id: 'filler', name: 'Filler', icon: Sparkle },
    { id: 'laser', name: 'Laser', icon: Lightning },
    { id: 'facial', name: 'Facial', icon: Gift },
    { id: 'skincare', name: 'Skincare', icon: Tag }
  ];

  const addTreatment = (treatment: TreatmentItem) => {
    const existingItem = items.find(item => item.treatment.id === treatment.id);
    
    if (existingItem) {
      updateQuantity(treatment.id, existingItem.quantity + 1);
    } else {
      setItems([...items, {
        treatment,
        quantity: 1,
        discount: 0,
        subtotal: treatment.basePrice
      }]);
    }
  };

  const removeItem = (treatmentId: string) => {
    setItems(items.filter(item => item.treatment.id !== treatmentId));
  };

  const updateQuantity = (treatmentId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(items.map(item => {
      if (item.treatment.id === treatmentId) {
        return {
          ...item,
          quantity,
          subtotal: item.treatment.basePrice * quantity
        };
      }
      return item;
    }));
  };

  const updateDiscount = (treatmentId: string, discount: number) => {
    setItems(items.map(item => {
      if (item.treatment.id === treatmentId) {
        return {
          ...item,
          discount: Math.max(0, Math.min(100, discount))
        };
      }
      return item;
    }));
  };

  const createProposal = async () => {
    if (items.length === 0) {
      toast.error('กรุณาเลือก treatment อย่างน้อย 1 รายการ');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get clinic info
      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!staffData) throw new Error('Clinic not found');

      // Create proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('sales_proposals')
        .insert({
          title: proposalTitle,
          customer_id: customerId,
          clinic_id: staffData.clinic_id,
          created_by: user.id,
          total_value: total,
          subtotal: subtotal,
          discount_amount: totalDiscount + packageDiscount,
          validity_days: validityDays,
          notes: notes,
          status: 'draft',
          items: items.map(item => ({
            treatment_id: item.treatment.id,
            treatment_name: item.treatment.name,
            quantity: item.quantity,
            unit_price: item.treatment.basePrice,
            discount_percent: item.discount,
            subtotal: item.subtotal
          }))
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      toast.success('สร้างใบเสนอราคาสำเร็จ!');
      onSuccess?.(proposal.id);
    } catch (error) {
      console.error('Failed to create proposal:', error);
      toast.error('ไม่สามารถสร้างใบเสนอราคาได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            สร้างใบเสนอราคาด่วน
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            สำหรับ: {customerName} {customerEmail && `(${customerEmail})`}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="ค้นหา treatment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary transition-all"
          />

          {/* Treatment List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTreatments.map(treatment => (
              <motion.div
                key={treatment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-secondary/20 rounded-xl border border-border/50 hover:bg-secondary/40 transition-all cursor-pointer"
                onClick={() => addTreatment(treatment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{treatment.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {treatment.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {treatment.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {treatment.duration}
                      </span>
                      <span>{treatment.sessionsRequired} session{treatment.sessionsRequired > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">฿{treatment.basePrice.toLocaleString()}</p>
                    <Button size="sm" className="mt-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quote Summary */}
        <div className="space-y-4">
          <Card className="p-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                สรุปราคา
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Quote Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item, index) => (
                  <motion.div
                    key={item.treatment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-background rounded-lg border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.treatment.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          ฿{item.treatment.basePrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.treatment.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.treatment.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.treatment.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-1">
                        <Percent className="w-3 h-3 text-muted-foreground" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateDiscount(item.treatment.id, parseInt(e.target.value) || 0)}
                          className="w-12 px-1 py-0.5 text-xs bg-background border rounded text-center"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      
                      <span className="text-sm font-bold">
                        ฿{item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pricing Summary */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>รวม:</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>ส่วนลด:</span>
                    <span>-฿{totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                {packageDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>ส่วนลดแพ็คเกจ:</span>
                    <span>-฿{packageDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>รวมทั้งหมด:</span>
                  <span className="text-primary">฿{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Proposal Settings */}
              <div className="space-y-3 mt-4">
                <input
                  type="text"
                  placeholder="หัวข้อใบเสนอราคา"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm">วันหมดอายุ:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                    className="w-16 px-2 py-1 bg-background border rounded text-sm"
                  />
                  <span className="text-sm text-muted-foreground">วัน</span>
                </div>
                <textarea
                  placeholder="หมายเหตุเพิ่มเติม..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={items.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ดูตัวอย่าง
                </Button>
                <Button
                  onClick={createProposal}
                  className="flex-1"
                  disabled={items.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="w-4 h-4 mr-2" />
                      สร้างใบเสนอราคา
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">ตัวอย่างใบเสนอราคา</h3>
                <Button variant="ghost" onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{proposalTitle}</h2>
                  <p className="text-sm text-muted-foreground">
                    สำหรับ: {customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ใบเสนอราคานี้มีอายุ {validityDays} วัน
                  </p>
                </div>

                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.treatment.id} className="flex justify-between p-2 bg-secondary/20 rounded">
                      <div>
                        <p className="font-medium">{item.treatment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} session{item.quantity > 1 ? 's' : ''} • {item.treatment.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">฿{item.subtotal.toLocaleString()}</p>
                        {item.discount > 0 && (
                          <p className="text-xs text-emerald-600">-{item.discount}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>รวมทั้งหมด:</span>
                    <span className="text-primary">฿{total.toLocaleString()}</span>
                  </div>
                </div>

                {notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">หมายเหตุ:</p>
                    <p className="text-sm text-muted-foreground">{notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
