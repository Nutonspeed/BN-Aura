'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Check,
  WarningCircle,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
  value?: string | number;
  onChange?: (value: string) => void;
  className?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  options = [],
  value,
  onChange,
  className = ''
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputId = `field-${name}`;
  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';
  const isSelect = type === 'select';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-white"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        {isTextarea ? (
          <textarea
            id={inputId}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all resize-none ${
              error 
                ? 'border-red-500/50 focus:ring-red-500/50' 
                : focused 
                  ? 'border-primary/50 focus:ring-primary/50' 
                  : 'border-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={4}
          />
        ) : isSelect ? (
          <select
            id={inputId}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
              error 
                ? 'border-red-500/50 focus:ring-red-500/50' 
                : focused 
                  ? 'border-primary/50 focus:ring-primary/50' 
                  : 'border-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="" className="bg-slate-800">
              {placeholder || 'Select an option'}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-800">
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            type={isPassword && !showPassword ? 'password' : type}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all ${
              error 
                ? 'border-red-500/50 focus:ring-red-500/50' 
                : focused 
                  ? 'border-primary/50 focus:ring-primary/50' 
                  : 'border-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
              isPassword ? 'pr-12' : ''
            }`}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400 text-sm"
        >
          <WarningCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {helperText && !error && (
        <p className="text-white/60 text-sm">{helperText}</p>
      )}
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full ${sizeClasses[size]} bg-slate-900 border border-white/10 rounded-2xl shadow-2xl ${className}`}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-primary hover:bg-primary/90 text-primary-foreground'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <p className="text-white/80">{message}</p>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${variantClasses[variant]}`}
          >
            {loading && <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  loading = false,
  submitText = 'FloppyDisk',
  cancelText = 'Cancel',
  size = 'md',
  className = ''
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} className={className}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
        {children}
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />}
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}