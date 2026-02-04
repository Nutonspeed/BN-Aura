'use client';



import { motion, AnimatePresence } from 'framer-motion';

import { 

  Plus, 

  MagnifyingGlass, 

  DotsThree, 

  Clock,

  Sparkle,

  Target,

  SquaresFour,

  List as ListIcon

} from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/client';

import { useState, useEffect, useMemo } from 'react';

import { Link } from '@/i18n/routing';

import {

  DndContext,

  DragEndEvent,

  DragOverlay,

  DragStartEvent,

  PointerSensor,

  useSensor,

  useSensors,

  closestCorners

} from '@dnd-kit/core';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useSortable } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { useLeadStatusRealtime } from '@/hooks/useHotLeadsRealtime';

import { useSalesLeads, useUpdateLeadStatus } from '@/hooks/useSalesLeads';

import InfiniteLeadsList from '@/components/sales/InfiniteLeadsList';



interface Lead {

  id: string;

  name: string;

  email: string;

  status: string;

  score: number;

  created_at: string;

  clinic_id: string;

}



const COLUMNS = [

  { id: 'new', title: 'New Leads' },

  { id: 'contacted', title: 'Contacted' },

  { id: 'qualified', title: 'Qualified' },

  { id: 'proposal_sent', title: 'Proposal Sent' },

];



export default function LeadsKanbanPage() {

  const [searchTerm, setSearchTerm] = useState('');

  const [activeId, setActiveId] = useState<string | null>(null);

  const [clinicId, setClinicId] = useState<string>('');

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');



  const supabase = useMemo(() => createClient(), []);

  

  // Get clinic ID from user

  useEffect(() => {

    async function getClinicId() {

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {

        const clinic = user.user_metadata?.clinic_id || '';

        setClinicId(clinic);

      }

    }

    getClinicId();

  }, [supabase]);

  

  // React Query hooks

  const { data: leads = [], isLoading: loading } = useSalesLeads(clinicId, { enabled: viewMode === 'kanban' });

  const updateLeadStatus = useUpdateLeadStatus();

  

  const sensors = useSensors(

    useSensor(PointerSensor, {

      activationConstraint: {

        distance: 8,

      },

    })

  );



  // Real-time status updates (still needed for cross-tab sync)

  useLeadStatusRealtime(() => {

    // React Query will auto-refetch on window focus

    // No manual state update needed

  });



  const getLeadsByStatus = (status: string) => {

    return leads.filter(l => 

      l.status === status && 

      (l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 

       l.email?.toLowerCase().includes(searchTerm.toLowerCase()))

    );

  };



  const handleDragStart = (event: DragStartEvent) => {

    setActiveId(event.active.id as string);

  };



  const handleDragEnd = async (event: DragEndEvent) => {

    const { active, over } = event;

    setActiveId(null);

    

    if (!over) return;

    

    const leadId = active.id as string;

    const newStatus = over.id as string;

    

    // Check if it's a valid column

    const validStatuses = COLUMNS.map(c => c.id);

    if (!validStatuses.includes(newStatus)) return;

    

    // Find the lead

    const lead = leads.find(l => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    

    // Use React Query mutation (includes optimistic update and error handling)

    updateLeadStatus.mutate({ leadId, status: newStatus });

  };



  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;



  return (

    <DndContext

      sensors={sensors}

      collisionDetection={closestCorners}

      onDragStart={handleDragStart}

      onDragEnd={handleDragEnd}

    >

      <motion.div 

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        className="space-y-10 h-[calc(100vh-160px)] flex flex-col pb-6"

      >

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 flex-shrink-0">

        <div className="space-y-1">

          <motion.div 

            initial={{ opacity: 0, x: -20 }}

            animate={{ opacity: 1, x: 0 }}

            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"

          >

            <Target className="w-4 h-4" />

            Revenue Pipeline

          </motion.div>

          <motion.h1 

            initial={{ opacity: 0, x: -20 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ delay: 0.1 }}

            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"

          >

            Leads <span className="text-primary text-glow">Management</span>

          </motion.h1>

          <motion.p 

            initial={{ opacity: 0, x: -20 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ delay: 0.2 }}

            className="text-muted-foreground font-light text-sm italic"

          >

            Orchestrating high-value aesthetic transformations.

          </motion.p>

        </div>

        

        <motion.div 

          initial={{ opacity: 0, scale: 0.9 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ delay: 0.3 }}

          className="flex items-center gap-4"

        >

          {/* View Toggle */}

          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex items-center gap-1">

            <button

              onClick={() => setViewMode('kanban')}

              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-white'}`}

            >

              <SquaresFour className="w-4 h-4" />

            </button>

            <button

              onClick={() => setViewMode('list')}

              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-white'}`}

            >

              <ListIcon className="w-4 h-4" />

            </button>

          </div>



          <div className="relative hidden lg:block group">

            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />

            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />

            <input 

              type="text" 

              placeholder="Search leads..."

              value={searchTerm}

              onChange={(e) => setSearchTerm(e.target.value)}

              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all w-72 backdrop-blur-md relative z-10"

            />

          </div>

          <button className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs">

            <Plus className="w-4 h-4 stroke-[3px]" />

            <span>Register New Lead</span>

          </button>

        </motion.div>

      </div>



      {/* Content Area */}

      {viewMode === 'list' ? (

        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">

          <InfiniteLeadsList 

            clinicId={clinicId} 

            onLeadClick={(lead) => {

              // Handle lead click (e.g. open details modal or navigate)

              window.location.href = `/analysis?leadId=${lead.id}`;

            }}

          />

        </div>

      ) : loading ? (

        <div className="flex-1 flex flex-col items-center justify-center space-y-6">

          <div className="relative">

            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />

            <Sparkle className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />

          </div>

          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Synchronizing Pipeline Node...</p>

        </div>

      ) : (

        <div className="flex-1 flex gap-8 overflow-x-auto pb-6 custom-scrollbar">

          {COLUMNS.map((column, colIdx) => (

            <SortableContext

              key={column.id}

              items={getLeadsByStatus(column.id).map(l => l.id)}

              strategy={verticalListSortingStrategy}

            >

              <motion.div 

                id={column.id}

                data-column={column.id}

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: 0.4 + colIdx * 0.1 }}

                className="flex-shrink-0 w-[340px] flex flex-col gap-6"

              >

              <div className="flex items-center justify-between px-4">

                <div className="flex items-center gap-3">

                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />

                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{column.title}</h3>

                  <span className="bg-white/5 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full border border-primary/20 shadow-sm">

                    {getLeadsByStatus(column.id).length}

                  </span>

                </div>

                <button className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-all">

                  <Plus className="w-4 h-4" />

                </button>

              </div>



              <div className="flex-1 space-y-5 bg-white/[0.02] border border-white/[0.05] rounded-[40px] p-5 min-h-[300px] backdrop-blur-sm relative group/column overflow-y-auto custom-scrollbar">

                <AnimatePresence mode="popLayout">

                  {getLeadsByStatus(column.id).length > 0 ? (

                    getLeadsByStatus(column.id).map((lead, idx) => (

                      <DraggableLeadCard

                        key={lead.id}

                        lead={lead}

                        idx={idx}

                      />

                    ))

                  ) : (

                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-16 space-y-4">

                      <div className="w-16 h-16 border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center">

                        <Plus className="w-6 h-6 text-white/20" />

                      </div>

                      <div className="space-y-1">

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Empty Node</p>

                        <p className="text-[9px] text-muted-foreground font-light max-w-[120px]">Awaiting new lead registrations.</p>

                      </div>

                    </div>

                  )}

                </AnimatePresence>

              </div>

            </motion.div>

          </SortableContext>

        ))}

      </div>

      )}

      </motion.div>

  

  <DragOverlay>

    {activeLead ? (

      <div className="glass-card p-5 rounded-[28px] border border-primary/40 shadow-2xl opacity-90 w-[340px]">

        <div className="flex items-start gap-4 mb-5">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-sm font-black border border-primary/20 shadow-premium">

            {activeLead.name?.split(' ').map((n: string) => n[0]).join('') || 'L'}

          </div>

          <div className="space-y-1 pr-6">

            <h4 className="text-sm font-black text-white truncate w-44">{activeLead.name}</h4>

            <div className="flex items-center gap-1.5">

              <div className="w-1 h-1 rounded-full bg-emerald-400" />

              <p className="text-[10px] text-muted-foreground truncate w-40 font-medium italic">{activeLead.email}</p>

            </div>

          </div>

        </div>

      </div>

    ) : null}

  </DragOverlay>

</DndContext>

  );

}



// Draggable Lead Card Component

function DraggableLeadCard({ lead, idx }: { lead: Lead; idx: number }) {

  const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

    isDragging,

  } = useSortable({ id: lead.id });



  const style = {

    transform: CSS.Transform.toString(transform),

    transition,

    opacity: isDragging ? 0.5 : 1,

  };



  return (

    <motion.div

      ref={setNodeRef}

      style={style}

      {...attributes}

      {...listeners}

      key={lead.id}

      data-lead-id={lead.id}

      layout

      initial={{ opacity: 0, scale: 0.95, y: 10 }}

      animate={{ opacity: 1, scale: 1, y: 0 }}

      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}

      transition={{ duration: 0.3, delay: idx * 0.05 }}

      whileHover={{ y: -4, transition: { duration: 0.2 } }}

      className="glass-card p-5 rounded-[28px] border border-white/5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group/card relative overflow-hidden"

    >

      {/* Status Accent Glow */}

      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />

      

      <div className="absolute top-5 right-5 opacity-0 group-hover/card:opacity-100 transition-all">

        <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white">

          <DotsThree className="w-4 h-4" />

        </button>

      </div>

      

      <div className="flex items-start gap-4 mb-5">

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-sm font-black border border-primary/20 shadow-premium group-hover/card:scale-110 transition-transform duration-500">

          {lead.name?.split(' ').map((n: string) => n[0]).join('') || 'L'}

        </div>

        <div className="space-y-1 pr-6">

          <h4 className="text-sm font-black text-white group-hover/card:text-primary transition-colors truncate w-44">{lead.name}</h4>

          <div className="flex items-center gap-1.5">

            <div className="w-1 h-1 rounded-full bg-emerald-400" />

            <p className="text-[10px] text-muted-foreground truncate w-40 font-medium italic">{lead.email}</p>

          </div>

        </div>

      </div>



      <div className="flex items-center justify-between pt-5 border-t border-white/5">

        <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">

          <Clock className="w-3 h-3 text-primary/60" />

          {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}

        </div>

        <div className="flex items-center gap-3">

          <Link href={`/analysis?leadId=${lead.id}`}>

            <button className="p-2 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)]">

              <Sparkle className="w-3.5 h-3.5 stroke-[2.5px]" />

            </button>

          </Link>

          <div className="flex flex-col items-end">

            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Scoring</span>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] font-black">

              {lead.score || 0}%

            </div>

          </div>

        </div>

      </div>

    </motion.div>

  );

}

