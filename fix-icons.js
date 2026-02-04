const fs = require('fs');
const path = require('path');

const replacements = [
  ['<Loader2', '<SpinnerGap'],
  ['<ChevronLeft', '<CaretLeft'],
  ['<ChevronRight', '<CaretRight'],
  ['<ChevronUp', '<CaretUp'],
  ['<ChevronDown', '<CaretDown'],
  ['<CheckCircle2', '<CheckCircle'],
  ['<Sparkles', '<Sparkle'],
  ['<Building2', '<Buildings'],
  ['<AlertCircle', '<WarningCircle'],
  ['<AlertTriangle', '<Warning'],
  ['<Calendar', '<CalendarDots'],
  ['<Mail', '<EnvelopeSimple'],
  ['<Search', '<MagnifyingGlass'],
  ['<DollarSign', '<CurrencyDollar'],
  ['<Activity', '<Pulse'],
  ['<Zap', '<Lightning'],
  ['<BriefcaseMedical', '<FirstAidKit'],
  ['<Trash2', '<Trash'],
  ['<RefreshCw', '<ArrowsClockwise'],
  ['<Settings', '<Gear'],
  ['<MessageSquare', '<ChatCircle'],
  ['<MessageCircle', '<ChatCircle'],
  ['<TrendingUp', '<TrendUp'],
  ['<TrendingDown', '<TrendDown'],
  ['<Edit2', '<PencilSimple'],
  ['<Save', '<FloppyDisk'],
  ['<KeyRound', '<Key'],
  ['<HelpCircle', '<Question'],
  ['<BarChart3', '<ChartBar'],
  ['<ExternalLink', '<ArrowSquareOut'],
  ['<EyeOff', '<EyeSlash'],
  ['<Unlock', '<LockOpen'],
  ['<Filter', '<Funnel'],
  ['<Share2', '<ShareNetwork'],
  ['<Send', '<PaperPlaneTilt'],
  ['<MoreVertical', '<DotsThreeVertical'],
  ['<MoreHorizontal', '<DotsThree'],
  ['<WifiOff', '<WifiSlash'],
  ['<Server', '<HardDrives'],
  ['<Settings2', '<GearSix'],
  ['<ArrowUpCircle', '<ArrowCircleUp'],
  ['<ArrowDownCircle', '<ArrowCircleDown'],
  ['<Award', '<Medal'],
  ['<BadgeCheck', '<SealCheck'],
  ['<Banknote', '<Money'],
  ['<Flame', '<Fire'],
  ['<SmilePlus', '<SmileyWink'],
  ['<Meh', '<SmileyMeh'],
  ['<Frown', '<SmileyXEyes'],
  ['<Smile', '<Smiley'],
  ['<MousePointer', '<Cursor'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

walkDir('./app');
walkDir('./components');
console.log('Done!');
