-- Run this in Supabase SQL Editor (recommended for MVP).
-- It creates the tables used by the app:
-- - public.memos
-- - public.contradiction_cards

create extension if not exists pgcrypto;

-- ----------------------------
-- memos
-- ----------------------------
create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists memos_created_at_idx on public.memos (created_at desc);

-- ----------------------------
-- contradiction_cards
-- Stores Claude's "connected but opposite" pair.
-- We denormalize memo contents for easy rendering.
-- ----------------------------
create table if not exists public.contradiction_cards (
  id uuid primary key default gen_random_uuid(),

  memo_a_id uuid not null references public.memos (id) on delete cascade,
  memo_b_id uuid not null references public.memos (id) on delete cascade,

  -- Ordered pair for deduping cards regardless of direction.
  memo_low_id uuid not null,
  memo_high_id uuid not null,

  memo_a_content text not null,
  memo_b_content text not null,

  title text not null,
  connection text not null,
  opposition text not null,
  reasoning text,
  confidence double precision,

  model text,
  created_at timestamptz not null default now(),

  constraint contradiction_cards_distinct_memos check (memo_a_id <> memo_b_id),
  constraint contradiction_cards_ordered_pair check (memo_low_id <> memo_high_id),
  constraint contradiction_cards_unique_pair unique (memo_low_id, memo_high_id)
);

create index if not exists contradiction_cards_created_at_idx
  on public.contradiction_cards (created_at desc);

-- ----------------------------
-- MVP permissions (no auth)
-- ----------------------------
alter table public.memos disable row level security;
alter table public.contradiction_cards disable row level security;

grant select, insert, update, delete on table public.memos to anon, authenticated;
grant select, insert, update, delete on table public.contradiction_cards to anon, authenticated;

