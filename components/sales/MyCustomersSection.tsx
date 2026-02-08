'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users,
  MagnifyingGlass,
  ArrowSquareOut,
  ChatCircle,
  Plus
} from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import { useWorkflowState } from '@/hooks/useWorkflowStatus';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import CustomerModal from '../CustomerModal';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastContactDate: string | null;
}

function CustomerCard({ customer }: { customer: Customer }) {
  const { data: workflowState } = useWorkflowState(customer.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 bg-secondary rounded-xl border border-border hover:border-primary/30 transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {customer.name}
              <Link href={`/sales/customers/${customer.id}`}>
                <ArrowSquareOut className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
            {workflowState && (
              <WorkflowStatusBadge stage={workflowState.current_stage} size="sm" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-light">{customer.email}</p>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs font-bold text-emerald-400">฿{customer.totalSpent.toLocaleString()}</div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Total Spent</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-[10px] text-muted-foreground italic">
          Last contact: {customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}
        </span>
        <Link
          href={`/sales/chat?customerId=${encodeURIComponent(customer.id)}`}
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
        >
          <ChatCircle className="w-3 h-3" />
          Chat
        </Link>
      </div>
    </motion.div>
  );
}

export default function MyCustomersSection({ salesId }: { salesId?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales/customers`);
      const data = await res.json();
      if (data.success) {
        // Map API response to component format
        const mappedCustomers = data.customers.map((customer: any) => ({
          id: customer.id,
          name: customer.full_name,
          email: customer.email,
          phone: customer.phone || customer.metadata?.phone || '',
          totalSpent: 0, // TODO: Calculate from transactions
          lastContactDate: null // TODO: Get from last interaction
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCustomerSuccess = () => {
    fetchCustomers(); // Refresh customer list after creation
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">My Managed Customers</h3>
        </div>
        <button 
          onClick={() => setShowCustomerModal(true)}
          className="p-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-accent transition-all active:scale-95"
          title="Add New Customer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search your customers..."
          className="w-full bg-secondary border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">กำลังโหลดข้อมูลลูกค้า...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm italic">ไม่พบลูกค้า</div>
        ) : (
          filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        )}
      </div>

      {/* Customer Creation Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerSuccess}
      />
    </div>
  );
}