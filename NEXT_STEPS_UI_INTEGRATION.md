# 🎯 Next Steps: UI Integration Guide
## Phases 6-9 Implementation - Frontend Wiring

**Priority:** HIGH  
**Estimated Time:** 1-2 weeks  
**Complexity:** Medium

---

## 📋 Quick Start Checklist

### Week 1: Core Integration
- [ ] Day 1-2: Wire Beautician Dashboard to Task Queue API
- [ ] Day 3-4: Add Workflow Status to Sales Dashboard
- [ ] Day 5: Setup Supabase Realtime subscriptions

### Week 2: Customer Portal & Polish
- [ ] Day 1-3: Build Customer Loyalty Portal
- [ ] Day 4: Test end-to-end workflow
- [ ] Day 5: Bug fixes and optimization

---

## 🔧 Implementation Tasks

### 1. Beautician Dashboard Integration (Priority: CRITICAL)

**File:** `app/[locale]/(dashboard)/beautician/page.tsx`

**Current State:**
```typescript
// Mock data - needs to be replaced
const [tasks, setTasks] = useState([])
```

**Target State:**
```typescript
// Real-time tasks from API
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', userId, 'pending'],
  queryFn: async () => {
    const res = await fetch('/api/tasks?status=pending&limit=20')
    return res.json()
  },
  refetchInterval: 5000 // Poll every 5 seconds
})
```

**Steps:**

#### 1.1 Create Task Hook
**File:** `hooks/useBeauticianTasks.ts` (NEW)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useBeauticianTasks(status: string = 'pending') {
  return useQuery({
    queryKey: ['beautician-tasks', status],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?status=${status}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      return data.tasks || []
    },
    refetchInterval: 5000
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ taskId, status, notes }: any) => {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, status, notes })
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] })
    }
  })
}
```

#### 1.2 Update Beautician Page
**File:** `app/[locale]/(dashboard)/beautician/page.tsx`

**Changes:**
```typescript
// Add imports
import { useBeauticianTasks, useUpdateTask } from '@/hooks/useBeauticianTasks'

// Replace mock data
const { data: tasks = [], isLoading } = useBeauticianTasks('pending')
const updateTask = useUpdateTask()

// Add handlers
const handleStartTreatment = async (taskId: string) => {
  await updateTask.mutateAsync({ 
    taskId, 
    status: 'in_progress' 
  })
  // Also update workflow state
  await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'startTreatment',
      journeyId: task.workflow_id,
      beauticianId: userId
    })
  })
}

const handleCompleteTreatment = async (taskId: string, notes: string) => {
  await updateTask.mutateAsync({ 
    taskId, 
    status: 'completed',
    notes 
  })
  // Trigger follow-up and points
  await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'completeTreatment',
      journeyId: task.workflow_id,
      notes
    })
  })
}
```

#### 1.3 Update WorkflowTaskQueue Component
**File:** `components/beautician/WorkflowTaskQueue.tsx`

**Add real-time subscription:**
```typescript
useEffect(() => {
  const supabase = createClient()
  
  const channel = supabase
    .channel('task-updates')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'task_queue',
        filter: `assigned_to=eq.${userId}`
      },
      (payload) => {
        // Show notification
        toast.success('New task assigned!')
        // Refetch tasks
        queryClient.invalidateQueries(['beautician-tasks'])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [userId])
```

---

### 2. Sales Dashboard Integration (Priority: HIGH)

**File:** `app/[locale]/(dashboard)/sales/page.tsx`

**Steps:**

#### 2.1 Add Workflow Status Display
**File:** `components/sales/Customer360Modal.tsx`

**Add workflow timeline:**
```typescript
const { data: workflowState } = useQuery({
  queryKey: ['workflow', customerId],
  queryFn: async () => {
    const { data } = await supabase
      .from('workflow_states')
      .select('*, workflow_actions(*)')
      .eq('customer_id', customerId)
      .single()
    return data
  }
})

// Display workflow stages
<div className="workflow-timeline">
  {['lead_created', 'scanned', 'proposal_sent', 'payment_confirmed', 
    'treatment_scheduled', 'in_treatment', 'treatment_completed'].map(stage => (
    <div 
      key={stage}
      className={cn(
        'stage',
        workflowState?.current_stage === stage && 'active',
        workflowState?.workflow_actions?.some(a => a.to_stage === stage) && 'completed'
      )}
    >
      {stage}
    </div>
  ))}
</div>
```

#### 2.2 Add Confirm Payment Action
**File:** `components/sales/Customer360Modal.tsx`

```typescript
const handleConfirmPayment = async () => {
  // Update workflow
  await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'transition',
      workflowId: workflowState.id,
      toStage: 'payment_confirmed',
      userId: salesId,
      metadata: { amount: paymentAmount }
    })
  })
  
  // Create beautician task
  await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createTask',
      journeyId: workflowState.id,
      customerId: customer.id,
      beauticianId: selectedBeautician,
      treatmentName: selectedTreatment,
      scheduledTime: appointmentTime,
      priority: 'high'
    })
  })
  
  toast.success('Payment confirmed! Task assigned to beautician.')
}
```

#### 2.3 Add Workflow Kanban Board
**File:** `components/sales/WorkflowKanban.tsx`

**Wire to real data:**
```typescript
const { data: workflows = [] } = useQuery({
  queryKey: ['workflows', clinicId],
  queryFn: async () => {
    const { data } = await supabase
      .from('workflow_states')
      .select(`
        *,
        customers (full_name, phone),
        users:assigned_sales_id (full_name)
      `)
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
    return data
  }
})

// Group by stage
const groupedWorkflows = workflows.reduce((acc, w) => {
  if (!acc[w.current_stage]) acc[w.current_stage] = []
  acc[w.current_stage].push(w)
  return acc
}, {})
```

---

### 3. Customer Loyalty Portal (Priority: MEDIUM)

**File:** `app/[locale]/(dashboard)/customer/loyalty/page.tsx` (NEW)

**Full Implementation:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Star, Gift, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CustomerLoyaltyPage() {
  const [profile, setProfile] = useState(null)
  const [rewards, setRewards] = useState([])
  const [transactions, setTransactions] = useState([])
  const [achievements, setAchievements] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchLoyaltyData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch loyalty profile
      const { data: loyaltyProfile } = await supabase
        .from('loyalty_profiles')
        .select('*')
        .eq('customer_id', user.id)
        .single()

      setProfile(loyaltyProfile)

      // Fetch available rewards
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .lte('points_cost', loyaltyProfile?.available_points || 0)
        .order('points_cost')

      setRewards(rewardsData)

      // Fetch point transactions
      const { data: txData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setTransactions(txData)

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('clinic_id', loyaltyProfile?.clinic_id)

      setAchievements(achievementsData)
    }

    fetchLoyaltyData()
  }, [])

  const handleRedeemReward = async (rewardId: string) => {
    const res = await fetch('/api/loyalty/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward_id: rewardId })
    })
    
    if (res.ok) {
      toast.success('Reward redeemed! Check your coupons.')
      // Refresh data
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tier Display */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold capitalize">{profile?.current_tier} Tier</h2>
            <p className="text-sm opacity-90">
              {profile?.available_points} points available
            </p>
          </div>
          <Trophy className="w-16 h-16 opacity-80" />
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress to next tier</span>
            <span>{profile?.tier_progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${profile?.tier_progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-lg p-4 border">
        <h3 className="font-semibold mb-2">Refer a Friend</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 px-3 py-2 rounded">
            {profile?.referral_code}
          </code>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(profile?.referral_code)
              toast.success('Copied!')
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div>
        <h3 className="text-xl font-bold mb-4">Available Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{reward.name}</h4>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                  <p className="text-lg font-bold text-purple-600 mt-2">
                    {reward.points_cost} points
                  </p>
                </div>
                <Gift className="w-8 h-8 text-purple-500" />
              </div>
              <button
                onClick={() => handleRedeemReward(reward.id)}
                disabled={profile?.available_points < reward.points_cost}
                className="w-full mt-4 px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(achievement => {
            const unlocked = profile?.unlocked_achievements?.includes(achievement.id)
            return (
              <div 
                key={achievement.id}
                className={cn(
                  'border rounded-lg p-4 text-center',
                  unlocked ? 'bg-yellow-50 border-yellow-300' : 'opacity-50'
                )}
              >
                <div className="text-4xl mb-2">{achievement.badge_icon || '🏆'}</div>
                <h4 className="font-semibold text-sm">{achievement.name}</h4>
                {unlocked && <Star className="w-4 h-4 text-yellow-500 mx-auto mt-2" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={cn(
                'font-bold',
                tx.type === 'earned' ? 'text-green-600' : 'text-red-600'
              )}>
                {tx.type === 'earned' ? '+' : '-'}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### 4. Supabase Realtime Setup

**Steps:**

#### 4.1 Enable Replication in Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/royeyoxaaieipdajijni
2. Navigate to Database → Replication
3. Enable replication for:
   - `workflow_states`
   - `task_queue`
   - `workflow_events`
   - `loyalty_profiles`
   - `point_transactions`

#### 4.2 Create Realtime Hook
**File:** `hooks/useRealtimeWorkflow.ts` (NEW)

```typescript
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeWorkflow(userId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('workflow-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workflow_events' },
        (payload) => {
          console.log('Workflow event:', payload)
          queryClient.invalidateQueries({ queryKey: ['workflows'] })
        }
      )
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'task_queue',
          filter: `assigned_to=eq.${userId}`
        },
        (payload) => {
          toast.info('New task assigned!')
          queryClient.invalidateQueries({ queryKey: ['beautician-tasks'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Create new customer journey as sales
- [ ] Confirm payment and verify task appears for beautician
- [ ] Login as beautician and see task in queue
- [ ] Start treatment and verify workflow state updates
- [ ] Complete treatment and verify:
  - [ ] Follow-up scheduled
  - [ ] Points awarded to customer
  - [ ] Task marked as completed
- [ ] Login as customer and verify:
  - [ ] Points visible in loyalty portal
  - [ ] Can redeem rewards
  - [ ] Referral code works

### Automated Testing (Playwright)
```typescript
// tests/e2e/complete-workflow.spec.ts
test('complete customer journey', async ({ page, context }) => {
  // Test full workflow from sales → beautician → customer
})
```

---

## 📊 Success Metrics

**Before Integration:**
- Workflow states: 17 (existing data)
- Tasks: 3 (2 pending, 1 completed)
- Loyalty profiles: 0

**After Integration (Target):**
- Active workflows: 50+
- Daily tasks completed: 20+
- Loyalty profiles created: 100+
- Average workflow completion time: < 2 hours

---

## 🚨 Common Issues & Solutions

### Issue 1: Real-time not working
**Solution:** Check Supabase replication settings and RLS policies

### Issue 2: Tasks not appearing
**Solution:** Verify user_id matches assigned_to in task_queue

### Issue 3: Points not awarded
**Solution:** Check loyalty_profiles exists for customer

---

**Last Updated:** 2026-02-02  
**Next Review:** After Week 1 completion
