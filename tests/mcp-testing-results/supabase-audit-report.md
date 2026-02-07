# Supabase MCP Security & Performance Audit Report
**Date:** 2026-02-07  
**Project:** BN-Aura (`royeyoxaaieipdajijni`)  
**Region:** ap-south-1  
**Status:** ACTIVE_HEALTHY

---

## 🔴 Security Issues (WARN)

### 1. Leaked Password Protection Disabled
- **Impact:** Users can set compromised passwords that appear in data breaches
- **Fix:** Enable in Supabase Dashboard → Auth → Password Security
- **Ref:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 2. RLS Policy Always True — `security_audit_log`
- **Detail:** Policy `system_audit_insert` allows unrestricted INSERT (WITH CHECK = true)
- **Risk:** Any authenticated user can insert arbitrary audit log entries
- **Fix:** Restrict to service_role or specific admin roles
- **Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy

### 3. Function Search Path Mutable (7 functions)
- **Risk:** Potential search_path hijacking attack
- **Affected functions:**
  - `match_conversations`
  - `match_customers`
  - `auto_assign_task`
  - `get_workflow_stats`
  - `redeem_loyalty_reward_v2`
  - `apply_loyalty_redemption_to_pos`
  - `redeem_loyalty_reward`
- **Fix:** Add `SET search_path = ''` to each function definition
- **Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

### 4. Extension `vector` in Public Schema
- **Risk:** Extensions in public schema can be exploited
- **Fix:** Move to a dedicated `extensions` schema
- **Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

---

## 🟡 Security Issues (INFO)

### 5. RLS Enabled but No Policies (12 tables)
These tables have RLS enabled but zero policies, meaning **all access is blocked** (even for authenticated users via client):

| Table | Risk |
|-------|------|
| `consultation_messages` | Chat messages inaccessible |
| `customer_consents` | Consent records locked |
| `customer_memberships` | Membership data locked |
| `customer_packages` | Package data locked |
| `followup_sequence_steps` | Followup workflow locked |
| `gift_card_transactions` | Gift card records locked |
| `payment_plan_installments` | Payment installments locked |
| `payment_plans` | Payment plans locked |
| `staff_availability` | Staff scheduling locked |
| `staff_performance` | Performance data locked |
| `tips` | Tip records locked |
| `waitlist_notifications` | Waitlist notifications locked |

**Fix:** Add appropriate RLS policies or these tables will only be accessible via `service_role` (admin client).  
**Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

---

## 🔴 Performance Issues (WARN)

### 6. Duplicate Indexes (3 tables) — Drop immediately
| Table | Duplicate Indexes | Action |
|-------|-------------------|--------|
| `customers` | `idx_customers_sales_assigned` = `idx_customers_sales_created` | Drop one |
| `sales_commissions` | `idx_commissions_staff_date` = `idx_sales_commissions_staff_date` | Drop one |
| `workflow_events` | `idx_workflow_events_workflow` = `idx_workflow_events_workflow_id` | Drop one |

**Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

### 7. Multiple Permissive RLS Policies
Many tables have multiple permissive policies for the same role+action. Each policy is evaluated per query, degrading performance. Key affected tables:
- `workflow_states` (4 actions × multiple policies)
- `workflow_events` (4 actions × multiple policies)
- `workflow_actions` (4 actions × multiple policies)
- Many other tables with per-role policies (sales_staff, clinic_admin, beautician, super_admin)

**Fix:** Consolidate into single policies using `CASE` or `OR` conditions  
**Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

### 8. Unindexed Foreign Keys (many tables)
Foreign keys without covering indexes cause slow JOINs and DELETE cascades. Key affected:
- `ai_usage_logs` (created_by, user_id)
- `analysis_comparisons` (after_analysis_id, before_analysis_id, user_id)
- `appointments` (branch_id)
- `billing_plans` (created_by, updated_by)
- `branch_inventory` (product_id)
- And many more...

**Fix:** Create indexes on foreign key columns  
**Ref:** https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

---

## 📋 Priority Action Items

| Priority | Action | Effort |
|----------|--------|--------|
| 🔴 P0 | Enable leaked password protection | 1 min (dashboard toggle) |
| 🔴 P0 | Fix `security_audit_log` INSERT policy | 5 min |
| 🔴 P1 | Set search_path on 7 functions | 15 min |
| 🔴 P1 | Drop 3 duplicate indexes | 5 min |
| 🟡 P2 | Move `vector` extension to extensions schema | 10 min |
| 🟡 P2 | Add RLS policies to 12 unprotected tables | 1-2 hours |
| 🟡 P2 | Consolidate multiple permissive policies | 2-3 hours |
| 🟢 P3 | Add indexes to unindexed foreign keys | 30 min |
