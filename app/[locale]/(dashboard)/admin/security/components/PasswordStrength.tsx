'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface PasswordStrengthData {
  strong: number;
  medium: number;
  weak: number;
}

interface PasswordStrengthProps {
  passwordStrength: PasswordStrengthData;
}

export default function PasswordStrength({ passwordStrength }: PasswordStrengthProps) {
  const totalPasswordUsers = passwordStrength.strong + passwordStrength.medium + passwordStrength.weak;
  
  const categories = [
    {
      label: 'Strong',
      count: passwordStrength.strong,
      color: 'text-emerald-300',
      barColor: 'bg-emerald-500'
    },
    {
      label: 'Medium',
      count: passwordStrength.medium,
      color: 'text-yellow-300',
      barColor: 'bg-yellow-500'
    },
    {
      label: 'Weak',
      count: passwordStrength.weak,
      color: 'text-red-300',
      barColor: 'bg-red-500'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5" />
        Password Strength Distribution
      </h3>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.label}>
            <div className="flex justify-between text-sm mb-2">
              <span className={`${category.color} font-medium`}>{category.label}</span>
              <span className="text-white">{category.count} users</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`${category.barColor} h-2 rounded-full`}
                style={{ width: `${totalPasswordUsers > 0 ? (category.count / totalPasswordUsers) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
