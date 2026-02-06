'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Sparkle, Lightning, Camera, Users, 
  CheckCircle, Cpu, TrendUp,
  ChatCircle, EnvelopeSimple, Phone
} from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import FloatingElements from '@/components/FloatingElements';
import AnimatedMascot from '@/components/AnimatedMascot';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const mascotY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Floating 3D Elements */}
      <FloatingElements />
      
      {/* Background Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Hero Section - Minitap Style with Mascot */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        {/* Animated Mascot - Floating with Parallax */}
        <motion.div
          className="absolute top-1/4 right-[10%] z-0"
          style={{ y: mascotY }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <AnimatedMascot />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-10 max-w-6xl z-10"
        >
          {/* Bold Stats - Minitap inspired */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-5xl md:text-7xl font-bold text-primary mb-1">468</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Facial Points</div>
            </motion.div>
            <div className="h-16 w-px bg-white/10"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-5xl md:text-7xl font-bold text-primary mb-1">30<span className="text-3xl">s</span></div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Analysis Time</div>
            </motion.div>
            <div className="h-16 w-px bg-white/10"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-5xl md:text-7xl font-bold text-primary mb-1">95<span className="text-3xl">%</span></div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Accuracy</div>
            </motion.div>
          </div>

          {/* Main Headline - Bold & Direct */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
            The platform where
            <span className="block text-primary">skin analysis happens in seconds.</span>
          </h1>
          
          {/* Problem Statement - Minitap style */}
          <p className="text-2xl md:text-3xl text-foreground/80 max-w-4xl mx-auto font-light leading-relaxed">
            If skin consultation takes 30 minutes and customers still can&apos;t see results, 
            <span className="text-primary font-medium"> it&apos;s not your team. It&apos;s the tools.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/demo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-premium transition-all hover:brightness-110"
              >
                ทดลองใช้งาน
              </motion.button>
            </Link>
            
            <Link href="#contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-5 bg-secondary text-foreground rounded-xl font-bold text-lg border border-border backdrop-blur-xl transition-all hover:bg-secondary/80"
              >
                ติดต่อทีมขาย
              </motion.button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-12 flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Trusted by leading clinics</div>
            <div className="flex items-center gap-6 text-foreground/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">10+ คลินิกชั้นนำ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">5,000+ การวิเคราะห์</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">Enterprise Security</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* The Next Layer Section - Problem Statement */}
      <section className="relative py-32 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-foreground/60 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              the next layer of aesthetic consultation
            </motion.h2>
            <h3 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Automate how you <span className="text-primary">analyze, present,</span> and <span className="text-primary">close sales</span>
              <br />
              with real-time AI + AR.
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              No manual skin analysis, no guesswork, no lost customers.
              <br />
              <span className="text-foreground font-medium">If consultation takes hours and customers still hesitate, it&apos;s not your team. It&apos;s the tools!</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dual Audience Section - Minitap Style */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* For Clinic Owners */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-primary font-bold uppercase tracking-wider text-sm">For Clinic Owners</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Run your clinic without engineering bottlenecks.
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Launch new treatments, manage staff, and monitor AI usage. 
                <span className="text-foreground font-medium"> Get insights in real-time, not next week.</span>
              </p>
              <ul className="space-y-4">
                {[
                  "จัดการ packages และ treatments แยกรายสาขา",
                  "ดู analytics และ revenue dashboard แบบ real-time",
                  "ควบคุม AI quota และ usage tracking",
                  "Multi-clinic management ในที่เดียว"
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <span className="text-lg text-foreground/90">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-premium hover:brightness-110 transition-all"
                >
                  เริ่มใช้งาน
                </motion.button>
              </Link>
            </div>
            
            <motion.div
              className="relative h-[500px] glass-card rounded-3xl p-8 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-center space-y-4">
                <Users className="w-16 h-16 text-primary mx-auto" />
                <div className="text-6xl font-bold text-foreground">10+</div>
                <div className="text-xl text-muted-foreground">Clinics Trust Us</div>
              </div>
            </motion.div>
          </motion.div>

          {/* For Sales Staff */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              className="relative h-[500px] glass-card rounded-3xl p-8 flex items-center justify-center order-2 lg:order-1"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-center space-y-4">
                <Lightning className="w-16 h-16 text-primary mx-auto" />
                <div className="text-6xl font-bold text-foreground">30s</div>
                <div className="text-xl text-muted-foreground">Analysis Time</div>
              </div>
            </motion.div>

            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-sm">For Sales Staff</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                10x your closing rate with AI that shows results.
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Scan faces, see AI results instantly, and show AR simulations. 
                <span className="text-foreground font-medium"> Close deals in minutes, not hours.</span>
              </p>
              <ul className="space-y-4">
                {[
                  "สแกนและวิเคราะห์ผิวได้ทันที ใน 30 วินาที",
                  "แสดงผล AR simulator ให้ลูกค้าเห็นก่อนทำจริง",
                  "สร้างใบเสนอราคาอัตโนมัติด้วย AI",
                  "ติดตาม leads และ follow-up แบบ smart"
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                    <span className="text-lg text-foreground/90">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-premium hover:brightness-110 transition-all"
                >
                  ทดลองใช้ Demo
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              วิธีการทำงาน
            </h2>
            <p className="text-xl text-muted-foreground">
              เริ่มใช้งานได้ใน 3 ขั้นตอนง่าย ๆ
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "สแกนใบหน้า",
                desc: "ใช้กล้องสแกนใบหน้าลูกค้า ระบบจะวิเคราะห์อัตโนมัติด้วย AI",
                icon: Camera
              },
              {
                step: "02",
                title: "ดูผลวิเคราะห์",
                desc: "รับผลวิเคราะห์ครบถ้วน พร้อมคำแนะนำการรักษาที่เหมาะสม",
                icon: Cpu
              },
              {
                step: "03",
                title: "จำลอง AR",
                desc: "ให้ลูกค้าเห็นผลลัพธ์ก่อนรักษาด้วย AR Simulator",
                icon: TrendUp
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="absolute -top-6 -left-6 text-8xl font-bold text-primary/10">
                  {step.step}
                </div>
                <div className="glass-card p-8 rounded-3xl space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              เทคโนโลยีชั้นนำระดับโลก
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              พัฒนาด้วยเทคโนโลยีล้ำสมัยที่ใช้ในองค์กรใหญ่ทั่วโลก
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Google Gemini", desc: "AI Model" },
                { name: "MediaPipe", desc: "Face Detection" },
                { name: "Next.js 15", desc: "Framework" },
                { name: "Supabase", desc: "Database" }
              ].map((tech, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="text-lg font-bold text-foreground mb-1">{tech.name}</div>
                  <div className="text-sm text-muted-foreground">{tech.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground uppercase tracking-tight">
              Deployment <span className="text-primary text-glow">Tiers</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              เลือกแพ็กเกจที่เหมาะกับขนาดและเป้าหมายการเติบโตของคลินิกคุณ
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Starter",
                price: "2,990",
                desc: "สำหรับคลินิกเปิดใหม่",
                scans: "50",
                staff: "3 Accounts",
                features: ["AI Skin Analysis พื้นฐาน", "สร้าง AI Proposal", "ระบบจัดการลูกค้า", "Commission Tracking"],
                color: "text-blue-400",
                recommended: false
              },
              {
                name: "Professional",
                price: "8,990",
                desc: "สำหรับคลินิกที่ต้องการโต",
                scans: "200",
                staff: "10 Accounts",
                features: ["Advanced AI Analysis", "AI Lead Scoring", "ระบบแชทอัจฉริยะ", "Analytics พื้นฐาน"],
                color: "text-primary",
                recommended: true
              },
              {
                name: "Premium",
                price: "19,990",
                desc: "สำหรับคลินิกขนาดใหญ่",
                scans: "500",
                staff: "30 Accounts",
                features: ["Premium AI + AR", "Full BI Dashboard", "Workflow Automation", "Priority Support"],
                color: "text-emerald-400",
                recommended: false
              },
              {
                name: "Enterprise",
                price: "39,990",
                desc: "สำหรับเครือข่ายสาขา",
                scans: "Unlimited",
                staff: "ไม่จำกัด",
                features: ["Multi-branch Control", "Custom Branding", "Full API Access", "Dedicated Solutions"],
                color: "text-rose-400",
                recommended: false
              }
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className={cn(
                  "p-8 rounded-[48px] border transition-all duration-500 relative overflow-hidden group",
                  plan.recommended 
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_40px_rgba(var(--primary),0.15)] ring-1 ring-primary/30" 
                    : "bg-white/5 border-white/10 hover:border-white/20 shadow-xl"
                )}
              >
                {plan.recommended && (
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-glow">Most Popular</span>
                  </div>
                )}

                <div className="space-y-8 relative z-10">
                  <div>
                    <h3 className={cn("text-2xl font-black uppercase tracking-tight", plan.color)}>{plan.name}</h3>
                    <p className="text-xs text-muted-foreground italic font-light mt-1">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mr-1">฿</span>
                    <span className="text-5xl font-black text-foreground tracking-tighter tabular-nums">{plan.price}</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">/ เดือน</span>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/5 font-medium">
                    <div className="flex justify-between items-center text-[11px] uppercase tracking-widest">
                      <span className="text-foreground/40">AI Bandwidth</span>
                      <span className="text-foreground font-bold">{plan.scans} Scans</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] uppercase tracking-widest">
                      <span className="text-foreground/40">Capacity</span>
                      <span className="text-foreground font-bold">{plan.staff}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 pt-4">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-3 text-xs text-foreground/60">
                        <CheckCircle className={cn("w-4 h-4 shrink-0", plan.color)} />
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all",
                      plan.recommended 
                        ? "bg-primary text-primary-foreground shadow-premium" 
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    )}
                  >
                    เริ่มใช้งานเลย
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-foreground">
            พร้อมยกระดับคลินิกของคุณ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            เริ่มต้นใช้งาน BN-Aura วันนี้ หรือลองใช้ Demo ฟรีโดยไม่ต้องสมัครสมาชิก
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-premium hover:brightness-110 transition-all"
              >
                ทดลองใช้ Demo ฟรี
              </motion.button>
            </Link>
            
            <a href="#contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-secondary text-foreground rounded-xl font-bold text-lg border border-border hover:bg-secondary/80 transition-all"
              >
                ติดต่อทีมขาย
              </motion.button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">ติดต่อเรา</h2>
            <p className="text-xl text-muted-foreground">
              สนใจใช้งานหรือมีคำถาม? ติดต่อทีมเราได้เลย
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ChatCircle, title: "LINE Official", value: "@bn-aura", link: "https://line.me/ti/p/~@bn-aura" },
              { icon: EnvelopeSimple, title: "Email", value: "contact@bn-aura.com", link: "mailto:contact@bn-aura.com" },
              { icon: Phone, title: "โทรศัพท์", value: "02-XXX-XXXX", link: "tel:02XXXXXXX" }
            ].map((contact, i) => (
              <motion.a
                key={i}
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 rounded-2xl text-center hover:border-primary/50 transition-all group"
              >
                <contact.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-sm text-muted-foreground mb-1">{contact.title}</div>
                <div className="text-lg font-bold text-foreground">{contact.value}</div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-xl">BN-Aura</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/demo" className="hover:text-foreground transition-colors">
                Demo
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Login
              </Link>
              <a href="#contact" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; 2026 BN-Aura. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
