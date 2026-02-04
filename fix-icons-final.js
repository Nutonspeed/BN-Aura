const fs = require('fs');
const path = require('path');

// Exact replacements - only match exact icon names, not partial
const replacements = {
  // Double replacements to fix first
  'CalendarDotsDots': 'CalendarDots',
  'ChvvrononRight': 'CaretRight',
  'CheveononRight': 'CaretRight',
  
  // Lucide to Phosphor mappings (exact matches only)
  'BarChart3': 'ChartBar',
  'DollarSign': 'CurrencyDollar',
  'Building2': 'Buildings',
  'MessageSquare': 'ChatCircle',
  'MessageCircle': 'ChatCircle',
  'AlertCircle': 'WarningCircle',
  'AlertTriangle': 'Warning',
  'Activity': 'Pulse',
  'Zap': 'Lightning',
  'Mail': 'EnvelopeSimple',
  'Edit': 'PencilSimple',
  'Edit2': 'PencilSimple',
  'Smartphone': 'DeviceMobile',
  'Wifi': 'WifiHigh',
  'Download': 'DownloadSimple',
  'Upload': 'UploadSimple',
  'LayoutGrid': 'SquaresFour',
  'Sparkles': 'Sparkle',
  'TrendingUp': 'TrendUp',
  'TrendingDown': 'TrendDown',
  'Calendar': 'CalendarDots',
  'RotateCcw': 'ArrowCounterClockwise',
  'Send': 'PaperPlaneTilt',
  'ShieldX': 'ShieldSlash',
  'LogOut': 'SignOut',
  'Building': 'Buildings',
  'SmilePlus': 'SmileyWink',
  'Frown': 'SmileyXEyes',
  'Meh': 'SmileyMeh',
  'Smile': 'Smiley',
  'FileSpreadsheet': 'FileXls',
  'FileJson': 'FileJs',
  'Banknote': 'Money',
  'Layers': 'Stack',
  'Settings2': 'GearSix',
  'ArrowUpCircle': 'ArrowCircleUp',
  'ArrowDownCircle': 'ArrowCircleDown',
  'Languages': 'Translate',
  'ListTodo': 'ListChecks',
  'RefreshCw': 'ArrowsClockwise',
  'Search': 'MagnifyingGlass',
  'Trash2': 'Trash',
  'EyeOff': 'EyeSlash',
  'Filter': 'Funnel',
  'Share2': 'ShareNetwork',
  'MoreVertical': 'DotsThreeVertical',
  'MoreHorizontal': 'DotsThree',
  'WifiOff': 'WifiSlash',
  'Server': 'HardDrives',
  'Award': 'Medal',
  'BadgeCheck': 'SealCheck',
  'Flame': 'Fire',
  'MousePointer': 'Cursor',
  'HelpCircle': 'Question',
  'KeyRound': 'Key',
  'Save': 'FloppyDisk',
  'ExternalLink': 'ArrowSquareOut',
  'Unlock': 'LockOpen',
  'CheckCircle2': 'CheckCircle',
  'Loader2': 'SpinnerGap',
  'ChevronLeft': 'CaretLeft',
  'ChevronRight': 'CaretRight',
  'ChevronUp': 'CaretUp',
  'ChevronDown': 'CaretDown',
  'BriefcaseMedical': 'FirstAidKit',
  'Settings': 'Gear',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [from, to] of Object.entries(replacements)) {
    // Use word boundary to match exact icon names only
    // Match patterns like: <IconName, {IconName, IconName}, IconName,
    const patterns = [
      new RegExp(`<${from}(?=[\\s/>])`, 'g'),           // <IconName 
      new RegExp(`\\{${from}\\}`, 'g'),                  // {IconName}
      new RegExp(`icon:\\s*${from}(?=[,\\s}])`, 'g'),   // icon: IconName
      new RegExp(`Icon:\\s*${from}(?=[,\\s}])`, 'g'),   // Icon: IconName  
      new RegExp(`"${from}"`, 'g'),                      // "IconName"
      new RegExp(`'${from}'`, 'g'),                      // 'IconName'
    ];
    
    for (const pattern of patterns) {
      const replacement = pattern.source.includes('<') ? `<${to}` :
                         pattern.source.includes('{') ? `{${to}}` :
                         pattern.source.includes('icon:') ? `icon: ${to}` :
                         pattern.source.includes('Icon:') ? `Icon: ${to}` :
                         pattern.source.includes('"') ? `"${to}"` : `'${to}'`;
      
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
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
