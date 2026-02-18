-- Run this in Supabase SQL Editor.
-- Creates a simple memos table for the MVP.

create extension if not exists pgcrypto;

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists memos_created_at_idx on public.memos (created_at desc);

-- MVP: keep it simple (no auth). RLS off + allow anon read/write.
alter table public.memos disable row level security;
grant select, insert, update, delete on table public.memos to anon, authenticated;
