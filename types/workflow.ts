/**
 * Unified Workflow Engine - TypeScript Definitions
 * Phase 7: Cross-Role Workflow Integration
 */

export type WorkflowStage = 'scanned' | 'treatment_scheduled' | 'in_treatment' | 'completed' | 'follow_up';
export type TaskType = 'review_scan' | 'prepare_treatment' | 'perform_treatment' | 'follow_up' | 'contact_customer' | 'schedule_appointment';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
export type EventType = 'created' | 'stage_changed' | 'task_assigned' | 'task_completed' | 'note_added' | 'customer_contacted';

export interface WorkflowState {
  id: string;
  customer_id: string;
  clinic_id: string;
  current_stage: WorkflowStage;
  assigned_sales: string | null;
  assigned_beautician: string | null;
  scan_results: SkinAnalysisResult | null;
  treatment_plan: TreatmentPlan | null;
  priority_level: PriorityLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  workflow_id: string;
  event_type: EventType;
  actor_id: string | null;
  actor_role: string | null;
  event_data: Record<string, any> | null;
  previous_stage: string | null;
  new_stage: string | null;
  description: string | null;
  created_at: string;
}

export interface WorkflowTask {
  id: string;
  workflow_id: string;
  assigned_to: string;
  task_type: TaskType;
  task_title: string;
  task_description: string | null;
  task_data: Record<string, any> | null;
  status: TaskStatus;
  priority_level: PriorityLevel;
  due_date: string | null;
  estimated_duration: number | null; // in minutes
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTaskComment {
  id: string;
  task_id: string;
  author_id: string;
  comment_text: string;
  created_at: string;
}

export interface SkinAnalysisResult {
  skinType: string;
  age: number;
  overallScore: number;
  metrics: Array<{
    name: string;
    score: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  scanImage?: string;
}

export interface TreatmentPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  recommendedSessions: number;
  products: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  preCareInstructions: string[];
  postCareInstructions: string[];
}

export interface UnifiedWorkflow {
  id: string;
  state: WorkflowState;
  events: WorkflowEvent[];
  tasks: WorkflowTask[];
  customer: CustomerInfo;
  assignedSales: UserInfo | null;
  assignedBeautician: UserInfo | null;
}

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  notes: string | null;
  created_at: string;
}

export interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
}

export interface CreateWorkflowRequest {
  customer_id: string;
  scan_results: SkinAnalysisResult;
  treatment_plan?: TreatmentPlan;
  priority_level?: PriorityLevel;
  notes?: string;
  auto_assign_beautician?: boolean;
}

export interface UpdateWorkflowStageRequest {
  workflow_id: string;
  new_stage: WorkflowStage;
  notes?: string;
  assign_to?: string; // beautician ID for assignment
}

export interface CreateTaskRequest {
  workflow_id: string;
  assigned_to: string;
  task_type: TaskType;
  task_title: string;
  task_description?: string;
  task_data?: Record<string, any>;
  priority_level?: PriorityLevel;
  due_date?: string;
  estimated_duration?: number;
}

export interface UpdateTaskRequest {
  task_id: string;
  status?: TaskStatus;
  completion_notes?: string;
  assigned_to?: string;
  due_date?: string;
}

export interface WorkflowFilters {
  stage?: WorkflowStage;
  assigned_sales?: string;
  assigned_beautician?: string;
  priority_level?: PriorityLevel;
  date_from?: string;
  date_to?: string;
  customer_search?: string;
}

export interface TaskFilters {
  assigned_to?: string;
  status?: TaskStatus;
  task_type?: TaskType;
  priority_level?: PriorityLevel;
  due_from?: string;
  due_to?: string;
  workflow_id?: string;
}

export interface WorkflowStatistics {
  total_workflows: number;
  workflows_by_stage: Record<WorkflowStage, number>;
  tasks_by_status: Record<TaskStatus, number>;
  overdue_tasks: number;
  completion_rate: number;
  average_completion_time: number; // in hours
  staff_workload: Array<{
    user_id: string;
    user_name: string;
    role: string;
    active_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  }>;
}

export interface WorkflowNotification {
  id: string;
  user_id: string;
  workflow_id: string;
  type: 'task_assigned' | 'stage_changed' | 'task_completed' | 'overdue_task' | 'customer_update';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface WorkflowDashboardData {
  my_workflows: UnifiedWorkflow[];
  my_tasks: Array<{
    task: WorkflowTask;
    workflow: WorkflowState;
    customer: CustomerInfo;
  }>;
  team_workflows: UnifiedWorkflow[];
  statistics: WorkflowStatistics;
  notifications: WorkflowNotification[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// WebSocket Message Types
export interface WorkflowWebSocketMessage {
  type: 'workflow_created' | 'workflow_updated' | 'task_assigned' | 'task_updated' | 'stage_changed';
  data: any;
  user_id?: string;
  clinic_id?: string;
}

// Real-time Subscription Types
export interface WorkflowSubscription {
  workflow_id?: string;
  user_id?: string;
  clinic_id?: string;
  event_types?: EventType[];
}

// Task Assignment Logic Types
export interface BeauticianAvailability {
  user_id: string;
  user_name: string;
  current_workload: number;
  skills: string[];
  available_hours: number[];
  rating: number;
}

export interface AssignmentCriteria {
  required_skills?: string[];
  priority_level?: PriorityLevel;
  estimated_duration?: number;
  preferred_beautician?: string;
  avoid_beautician?: string[];
}
