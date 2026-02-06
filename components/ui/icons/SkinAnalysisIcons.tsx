/**
 * BN-Aura Premium Icon System
 * Professional SVG icons for Skin Analysis features
 * Replaces emoji with high-quality, consistent icons
 */

import {
  Brain,
  Scan,
  Sparkles,
  TrendingUp,
  Users,
  MessageCircle,
  Package,
  Sun,
  Moon,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  BarChart3,
  Activity,
  Target,
  Zap,
  Shield,
  Heart,
  Eye,
  Smile,
  Frown,
  ThermometerSun,
  CloudRain,
  Gauge,
  Layers,
  Grid3X3,
  CircleDot,
  Fingerprint,
  FlaskConical,
  Microscope,
  Stethoscope,
  Pill,
  Syringe,
  Timer,
  TrendingDown,
  ArrowRight,
  ChevronRight,
  Star,
  Award,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon size presets
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

interface IconProps {
  size?: IconSize;
  className?: string;
}

// ============================================
// AI & Analysis Icons
// ============================================

export function AIBrainIcon({ size = 'md', className }: IconProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      sizeMap[size],
      className
    )}>
      <Brain className="w-full h-full text-purple-500" />
      <Sparkles className="absolute -top-1 -right-1 w-1/3 h-1/3 text-pink-400" />
    </div>
  );
}

export function SkinScanIcon({ size = 'md', className }: IconProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      sizeMap[size],
      className
    )}>
      <Scan className="w-full h-full text-cyan-500" />
    </div>
  );
}

export function AnalysisIcon({ size = 'md', className }: IconProps) {
  return <Microscope className={cn(sizeMap[size], 'text-blue-500', className)} />;
}

// ============================================
// Metrics Icons
// ============================================

export function MetricsGridIcon({ size = 'md', className }: IconProps) {
  return <Grid3X3 className={cn(sizeMap[size], 'text-indigo-500', className)} />;
}

export function SymmetryIcon({ size = 'md', className }: IconProps) {
  return <Layers className={cn(sizeMap[size], 'text-amber-500', className)} />;
}

export function WrinkleIcon({ size = 'md', className }: IconProps) {
  return <Activity className={cn(sizeMap[size], 'text-rose-500', className)} />;
}

export function PoreIcon({ size = 'md', className }: IconProps) {
  return <CircleDot className={cn(sizeMap[size], 'text-orange-500', className)} />;
}

export function TextureIcon({ size = 'md', className }: IconProps) {
  return <Fingerprint className={cn(sizeMap[size], 'text-teal-500', className)} />;
}

export function SpotsIcon({ size = 'md', className }: IconProps) {
  return <Target className={cn(sizeMap[size], 'text-red-500', className)} />;
}

export function HydrationIcon({ size = 'md', className }: IconProps) {
  return <Droplets className={cn(sizeMap[size], 'text-sky-500', className)} />;
}

// ============================================
// AI Features Icons
// ============================================

export function TimeTravelIcon({ size = 'md', className }: IconProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      sizeMap[size],
      className
    )}>
      <Clock className="w-full h-full text-violet-500" />
      <Sparkles className="absolute -top-0.5 -right-0.5 w-1/3 h-1/3 text-amber-400" />
    </div>
  );
}

export function ARPreviewIcon({ size = 'md', className }: IconProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      sizeMap[size],
      className
    )}>
      <Eye className="w-full h-full text-emerald-500" />
      <Zap className="absolute -bottom-0.5 -right-0.5 w-1/3 h-1/3 text-yellow-400" />
    </div>
  );
}

export function SkinTwinIcon({ size = 'md', className }: IconProps) {
  return <Users className={cn(sizeMap[size], 'text-pink-500', className)} />;
}

export function ConsultantIcon({ size = 'md', className }: IconProps) {
  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      sizeMap[size],
      className
    )}>
      <MessageCircle className="w-full h-full text-blue-500" />
      <Sparkles className="absolute -top-0.5 -right-0.5 w-1/3 h-1/3 text-purple-400" />
    </div>
  );
}

export function ProductScanIcon({ size = 'md', className }: IconProps) {
  return <FlaskConical className={cn(sizeMap[size], 'text-green-500', className)} />;
}

// ============================================
// Environment Icons
// ============================================

export function SunIcon({ size = 'md', className }: IconProps) {
  return <Sun className={cn(sizeMap[size], 'text-amber-500', className)} />;
}

export function MoonIcon({ size = 'md', className }: IconProps) {
  return <Moon className={cn(sizeMap[size], 'text-indigo-400', className)} />;
}

export function UVIcon({ size = 'md', className }: IconProps) {
  return <ThermometerSun className={cn(sizeMap[size], 'text-orange-500', className)} />;
}

export function PollutionIcon({ size = 'md', className }: IconProps) {
  return <Wind className={cn(sizeMap[size], 'text-gray-500', className)} />;
}

export function HumidityIcon({ size = 'md', className }: IconProps) {
  return <CloudRain className={cn(sizeMap[size], 'text-blue-400', className)} />;
}

// ============================================
// Treatment Icons
// ============================================

export function TreatmentIcon({ size = 'md', className }: IconProps) {
  return <Stethoscope className={cn(sizeMap[size], 'text-teal-500', className)} />;
}

export function LaserIcon({ size = 'md', className }: IconProps) {
  return <Zap className={cn(sizeMap[size], 'text-yellow-500', className)} />;
}

export function InjectionIcon({ size = 'md', className }: IconProps) {
  return <Syringe className={cn(sizeMap[size], 'text-blue-500', className)} />;
}

export function SkincareIcon({ size = 'md', className }: IconProps) {
  return <Pill className={cn(sizeMap[size], 'text-pink-500', className)} />;
}

// ============================================
// Status Icons
// ============================================

export function SuccessIcon({ size = 'md', className }: IconProps) {
  return <CheckCircle2 className={cn(sizeMap[size], 'text-green-500', className)} />;
}

export function WarningIcon({ size = 'md', className }: IconProps) {
  return <AlertTriangle className={cn(sizeMap[size], 'text-amber-500', className)} />;
}

export function ImprovementIcon({ size = 'md', className }: IconProps) {
  return <TrendingUp className={cn(sizeMap[size], 'text-green-500', className)} />;
}

export function DeclineIcon({ size = 'md', className }: IconProps) {
  return <TrendingDown className={cn(sizeMap[size], 'text-red-500', className)} />;
}

// ============================================
// Score & Rating Icons
// ============================================

export function ScoreGaugeIcon({ size = 'md', className }: IconProps) {
  return <Gauge className={cn(sizeMap[size], 'text-purple-500', className)} />;
}

export function StarIcon({ size = 'md', className }: IconProps) {
  return <Star className={cn(sizeMap[size], 'text-amber-400 fill-amber-400', className)} />;
}

export function AwardIcon({ size = 'md', className }: IconProps) {
  return <Award className={cn(sizeMap[size], 'text-amber-500', className)} />;
}

export function CrownIcon({ size = 'md', className }: IconProps) {
  return <Crown className={cn(sizeMap[size], 'text-amber-500', className)} />;
}

// ============================================
// Action Icons
// ============================================

export function BookingIcon({ size = 'md', className }: IconProps) {
  return <Calendar className={cn(sizeMap[size], 'text-blue-500', className)} />;
}

export function ReportIcon({ size = 'md', className }: IconProps) {
  return <FileText className={cn(sizeMap[size], 'text-gray-600', className)} />;
}

export function AnalyticsIcon({ size = 'md', className }: IconProps) {
  return <BarChart3 className={cn(sizeMap[size], 'text-indigo-500', className)} />;
}

export function TimerIcon({ size = 'md', className }: IconProps) {
  return <Timer className={cn(sizeMap[size], 'text-orange-500', className)} />;
}

export function ArrowRightIcon({ size = 'md', className }: IconProps) {
  return <ArrowRight className={cn(sizeMap[size], className)} />;
}

export function ChevronRightIcon({ size = 'md', className }: IconProps) {
  return <ChevronRight className={cn(sizeMap[size], className)} />;
}

// ============================================
// Skin Concern Icons (Custom Compositions)
// ============================================

interface SkinConcernIconProps extends IconProps {
  concern: 'acne' | 'wrinkle' | 'pigmentation' | 'pore' | 'hydration' | 'elasticity' | 'redness' | 'texture';
}

const concernIcons: Record<SkinConcernIconProps['concern'], { icon: LucideIcon; color: string }> = {
  acne: { icon: CircleDot, color: 'text-red-500' },
  wrinkle: { icon: Activity, color: 'text-rose-500' },
  pigmentation: { icon: Target, color: 'text-amber-600' },
  pore: { icon: CircleDot, color: 'text-orange-500' },
  hydration: { icon: Droplets, color: 'text-sky-500' },
  elasticity: { icon: Heart, color: 'text-pink-500' },
  redness: { icon: AlertTriangle, color: 'text-red-400' },
  texture: { icon: Fingerprint, color: 'text-teal-500' },
};

export function SkinConcernIcon({ concern, size = 'md', className }: SkinConcernIconProps) {
  const { icon: Icon, color } = concernIcons[concern];
  return <Icon className={cn(sizeMap[size], color, className)} />;
}

// ============================================
// Composite Feature Card Icons
// ============================================

interface FeatureIconProps extends IconProps {
  feature: 'ai-analysis' | 'time-travel' | 'ar-preview' | 'skin-twin' | 'consultant' | 'product-scan' | 'environment' | 'report';
  variant?: 'default' | 'gradient' | 'outline';
}

export function FeatureIcon({ feature, size = 'lg', variant = 'default', className }: FeatureIconProps) {
  const baseClass = cn(
    'inline-flex items-center justify-center rounded-xl p-2',
    variant === 'gradient' && 'bg-gradient-to-br',
    variant === 'outline' && 'border-2',
    className
  );

  const configs: Record<FeatureIconProps['feature'], { icon: React.ReactNode; gradient: string; border: string }> = {
    'ai-analysis': {
      icon: <AIBrainIcon size={size} />,
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
    },
    'time-travel': {
      icon: <TimeTravelIcon size={size} />,
      gradient: 'from-violet-500/20 to-indigo-500/20',
      border: 'border-violet-500/30',
    },
    'ar-preview': {
      icon: <ARPreviewIcon size={size} />,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
    },
    'skin-twin': {
      icon: <SkinTwinIcon size={size} />,
      gradient: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-500/30',
    },
    'consultant': {
      icon: <ConsultantIcon size={size} />,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
    },
    'product-scan': {
      icon: <ProductScanIcon size={size} />,
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
    },
    'environment': {
      icon: <SunIcon size={size} />,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
    },
    'report': {
      icon: <ReportIcon size={size} />,
      gradient: 'from-gray-500/20 to-slate-500/20',
      border: 'border-gray-500/30',
    },
  };

  const config = configs[feature];

  return (
    <div className={cn(
      baseClass,
      variant === 'gradient' && config.gradient,
      variant === 'outline' && config.border,
    )}>
      {config.icon}
    </div>
  );
}

// Export icon map for dynamic usage
export const iconMap = {
  'ai-brain': AIBrainIcon,
  'skin-scan': SkinScanIcon,
  'analysis': AnalysisIcon,
  'metrics': MetricsGridIcon,
  'symmetry': SymmetryIcon,
  'wrinkle': WrinkleIcon,
  'pore': PoreIcon,
  'texture': TextureIcon,
  'spots': SpotsIcon,
  'hydration': HydrationIcon,
  'time-travel': TimeTravelIcon,
  'ar-preview': ARPreviewIcon,
  'skin-twin': SkinTwinIcon,
  'consultant': ConsultantIcon,
  'product-scan': ProductScanIcon,
  'sun': SunIcon,
  'moon': MoonIcon,
  'uv': UVIcon,
  'pollution': PollutionIcon,
  'humidity': HumidityIcon,
  'treatment': TreatmentIcon,
  'laser': LaserIcon,
  'injection': InjectionIcon,
  'skincare': SkincareIcon,
  'success': SuccessIcon,
  'warning': WarningIcon,
  'improvement': ImprovementIcon,
  'decline': DeclineIcon,
  'score': ScoreGaugeIcon,
  'star': StarIcon,
  'award': AwardIcon,
  'crown': CrownIcon,
  'booking': BookingIcon,
  'report': ReportIcon,
  'analytics': AnalyticsIcon,
  'timer': TimerIcon,
};

export type IconName = keyof typeof iconMap;
