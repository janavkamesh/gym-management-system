-- Create core tables in strict parent-to-child order

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    phone TEXT,
    base_salary NUMERIC NOT NULL,
    join_date DATE,
    archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    join_date DATE,
    expiry_date DATE,
    status TEXT,
    freeze_start DATE,
    freeze_end DATE,
    archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    phone TEXT,
    promised_date DATE,
    outcome TEXT,
    converted_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pt_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    commission_percent NUMERIC,
    assigned_date DATE,
    is_active BOOLEAN,
    fee_amount NUMERIC,
    trainer_share NUMERIC,
    duration_days INTEGER,
    next_pt_due_date DATE
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    method TEXT,
    date DATE,
    collected_date DATE,
    payment_type TEXT,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    period_start DATE,
    period_end DATE,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    edit_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    month_start DATE,
    base_salary_snapshot NUMERIC,
    commission_snapshot NUMERIC,
    advances_deducted_snapshot NUMERIC,
    net_paid NUMERIC,
    paid_date DATE,
    method TEXT,
    note TEXT,
    linked_expense_id UUID,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    user_id UUID
);

CREATE TABLE IF NOT EXISTS salary_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    date DATE,
    note TEXT,
    deducted_flag BOOLEAN DEFAULT FALSE,
    salary_payment_id UUID REFERENCES salary_payments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    category TEXT,
    amount NUMERIC NOT NULL,
    recurring_flag BOOLEAN DEFAULT FALSE,
    receipt_url TEXT,
    date DATE,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    linked_entity_type TEXT,
    linked_entity_id UUID
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    category TEXT,
    action TEXT,
    description TEXT,
    entity_type TEXT,
    entity_id UUID,
    entity_name TEXT,
    amount NUMERIC,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  subscription_json jsonb NOT NULL,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
