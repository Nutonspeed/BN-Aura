'use client';

import { 
  Package,
  Plus,
  MagnifyingGlass,
  Warning,
  TrendUp,
  PencilSimple,
  Trash,
  ChartBar,
  SpinnerGap,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  CaretRight,
  Briefcase,
  Monitor,
  IdentificationBadge,
  Stack,
  Archive,
  Tag,
  WarningCircle,
  Funnel,
  Cube,
  ListBullets,
  ArrowsLeftRight,
  Truck,
  Buildings
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductModal from '@/components/ProductModal';
import StockMovementModal from '@/components/StockMovementModal';
import { Link } from '@/i18n/routing';
import ResponsiveTable from '@/components/ui/ResponsiveTable';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  min_stock_level: number;
  cost_price: number;
  sale_price: number;
  created_at: string;
  image_url?: string;
}

export default function InventoryManagement() {
  const { goBack } = useBackNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | undefined>(undefined);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock_quantity <= p.min_stock_level);
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
  }, [products]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProductForMovement(product);
    setIsMovementModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this asset node?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      header: 'Asset Intelligence',
      accessor: (product: Product) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block">{product.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{product.category}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Serial SKU',
      accessor: (product: Product) => (
        <span className="text-[11px] text-muted-foreground font-mono bg-secondary px-3 py-1.5 rounded-lg border border-border group-hover:border-primary/20 transition-colors uppercase">
          {product.sku || 'N/A'}
        </span>
      )
    },
    {
      header: 'Stock Level',
      accessor: (product: Product) => {
        const isLowStock = product.stock_quantity <= product.min_stock_level;
        return (
          <div className="space-y-1.5 w-32">
            <div className="flex items-center gap-2">
              <span className={cn("text-base font-bold tabular-nums", isLowStock ? "text-rose-500" : "text-foreground")}>
                {product.stock_quantity}
              </span>
              {isLowStock && <Warning className="w-4 h-4 text-rose-500 animate-pulse" />}
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border">
              <div 
                className={cn("h-full rounded-full", isLowStock ? 'bg-rose-500' : 'bg-emerald-500')} 
                style={{ width: `${Math.min(100, (product.stock_quantity / (product.min_stock_level * 2)) * 100)}%` }} 
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Unit Cost',
      accessor: (product: Product) => (
        <span className="text-sm text-muted-foreground font-medium tabular-nums">
          ฿{product.cost_price?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      header: 'Market Val',
      accessor: (product: Product) => (
        <span className="text-sm text-emerald-500 font-bold tabular-nums">
          ฿{product.sale_price?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      header: 'Total Eq.',
      accessor: (product: Product) => (
        <span className="text-sm font-bold text-foreground tracking-tight tabular-nums">
          ฿{(product.stock_quantity * product.cost_price).toLocaleString()}
        </span>
      )
    },
    {
      header: '',
      className: 'text-right',
      accessor: (product: Product) => (
        <div className="flex items-center justify-end gap-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleAdjustStock(product)}
            className="p-2 text-primary/60 hover:text-primary transition-all rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/10"
            title="Adjust Stock"
          >
            <TrendUp className="w-4 h-4" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleEditProduct(product)}
            className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-lg hover:bg-accent border border-transparent hover:border-border"
            title="Edit Asset"
          >
            <PencilSimple className="w-4 h-4" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDeleteProduct(product.id)}
            className="p-2 text-rose-500/40 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10"
            title="Terminate Asset"
          >
            <Trash className="w-4 h-4" />
          </motion.button>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      <StockMovementModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={fetchProducts}
        product={selectedProductForMovement}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Package weight="duotone" className="w-4 h-4" />
            ระบบจัดการคลังสินค้า
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Inventory <span className="text-primary">Matrix</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            ติดตามสินค้าแบบเรียลไทม์ จัดการวัตถุดิบ และเพิ่มประสิทธิภาพสต็อก
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner mr-2">
            {[
              { id: 'main', label: 'คลัง', icon: Archive, href: '/clinic/inventory' },
              { id: 'orders', label: 'คำสั่งซื้อ', icon: Truck, href: '/clinic/inventory/orders' },
              { id: 'alerts', label: 'แจ้งเตือน', icon: WarningCircle, href: '/clinic/inventory/alerts' },
              { id: 'suppliers', label: 'ซัพพลายเออร์', icon: Buildings, href: '/clinic/inventory/suppliers' }
            ].map((node) => (
              <Link key={node.id} href={node.href}>
                <button
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-2",
                    node.id === 'main'
                      ? "bg-primary text-primary-foreground border-primary shadow-premium"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <node.icon weight={node.id === 'main' ? "fill" : "bold"} className="w-3.5 h-3.5" />
                  {node.label}
                </button>
              </Link>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={fetchProducts}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            ซิงค์ข้อมูล
          </Button>
          <Button 
            onClick={handleAddProduct}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <Plus weight="bold" className="w-4 h-4" />
            เพิ่มสินค้า
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="สินค้าทั้งหมด"
          value={products.length}
          icon={Cube}
          className="p-4"
        />
        <StatCard
          title="สินค้าใกล้หมด"
          value={lowStockProducts.length}
          icon={WarningCircle}
          iconColor="text-rose-500"
          className="p-4"
        />
        <StatCard
          title="มูลค่ารวม"
          value={totalValue}
          prefix="฿"
          icon={ChartBar}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="หมวดหมู่"
          value={categories.length - 1}
          icon={Tag}
          iconColor="text-purple-500"
          className="p-4"
        />
      </div>

      {/* Low Stock Alert Hub */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="px-2"
          >
            <Card className="border-none relative overflow-hidden bg-rose-500/10 shadow-glow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-transparent" />
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500 border border-rose-500/30 shadow-inner">
                      <Warning weight="fill" className="w-7 h-7 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-rose-500 uppercase tracking-tight">สินค้าใกล้หมด Detected</h3>
                      <p className="text-rose-500/70 text-xs font-medium italic">
                        {lowStockProducts.length} asset nodes have reached critical operational thresholds.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {lowStockProducts.slice(0, 3).map((p, idx) => (
                        <div key={p.id} className="w-10 h-10 rounded-full border-2 border-rose-900 bg-secondary flex items-center justify-center text-[10px] font-black uppercase text-rose-500 shadow-lg relative z-[30-idx]">
                          {p.name.charAt(0)}
                        </div>
                      ))}
                      {lowStockProducts.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-rose-900 bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-lg relative z-0">
                          +{lowStockProducts.length - 3}
                        </div>
                      )}
                    </div>
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-premium px-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest ml-4">
                      Initialize Replenishment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="ค้นหาสินค้า, SKU หรือหมวดหมู่..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-64 bg-secondary/50 border border-border rounded-2xl py-3.5 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none font-bold"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-card">
                    {category === 'all' ? 'ทุกหมวดหมู่' : `CLUSTER: ${category.toUpperCase()}`}
                  </option>
                ))}
              </select>
              <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
        </Card>
      </div>

      {/* Asset Registry Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredProducts}
            loading={loading}
            rowKey={(p) => p.id}
            emptyMessage="Zero asset nodes detected in current clinical registry."
            mobileCard={(p) => {
              const isLowStock = p.stock_quantity <= p.min_stock_level;
              return (
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-inner",
                        isLowStock ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        <Package weight="duotone" className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate uppercase tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-2 py-0.5">{p.category}</Badge>
                          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">{p.sku || 'NO_SKU'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={isLowStock ? 'destructive' : 'success'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                      {isLowStock ? 'DEPLETED' : 'OPERATIONAL'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Available Units</p>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-lg font-black tabular-nums", isLowStock ? "text-rose-500" : "text-foreground")}>{p.stock_quantity}</p>
                        {isLowStock && <Warning weight="fill" className="w-3.5 h-3.5 text-rose-500" />}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Market Valuation</p>
                      <p className="text-lg font-black text-emerald-500 tabular-nums">฿{p.sale_price?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Consolidated Equity</p>
                      <p className="text-sm font-black text-foreground tabular-nums tracking-tighter">฿{(p.stock_quantity * p.cost_price).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAdjustStock(p)} 
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-border/50 rounded-xl text-primary hover:bg-primary/5"
                      >
                        <ArrowsLeftRight weight="bold" className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleEditProduct(p)} 
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0 border-border/50 rounded-xl text-muted-foreground hover:bg-secondary"
                      >
                        <PencilSimple weight="bold" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </Card>
      </div>
    </motion.div>
  );
}
