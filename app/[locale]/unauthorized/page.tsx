'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldSlash, ArrowLeft, SignOut } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';

// Simple Button component inline to avoid import issues
const Button = ({ 
  children, 
  onClick, 
  variant = 'default',
  className = '' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'default' | 'outline';
  className?: string;
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm';
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium',
    outline: 'border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function UnauthorizedPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/th/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto"
          >
            <ShieldSlash className="w-10 h-10 text-destructive" />
          </motion.div>

          {/* Content */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              ไม่มีสิทธิ์เข้าถึง
            </h1>
            <p className="text-muted-foreground">
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากคิดว่านี่คือข้อผิดพลาด
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าก่อนหน้า
            </Button>
            
            <Button
              onClick={handleLogout}
              className="w-full"
            >
              <SignOut className="w-4 h-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            หากต้องการความช่วยเหลือ กรุณาติดต่อฝ่ายสนับสนุน
          </p>
        </div>
      </motion.div>
    </div>
  );
}
