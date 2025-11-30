create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists announcements (
  id uuid primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

create table if not exists cultos (
  id uuid primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  name text not null,
  role text not null,
  password_hash text not null,
  status text not null default 'active',
  created_at timestamptz default now()
);
