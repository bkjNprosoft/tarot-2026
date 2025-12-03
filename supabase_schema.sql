-- Create a table for storing tarot readings
create table public.readings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null, -- Optional, for authenticated users or anonymous tracking if we implement it
  category text not null, -- 'general', 'love', 'career', etc.
  cards jsonb not null, -- Array of card IDs e.g. ["fool", "magician"]
  created_at timestamp with time zone not null default now(),
  constraint readings_pkey primary key (id)
);

-- Set up Row Level Security (RLS)
-- For now, we'll allow public insert/select for simplicity, 
-- but in a real app you might restrict this based on user_id.

alter table public.readings enable row level security;

-- Allow anyone to insert readings (for anonymous users)
create policy "Enable insert for all users" on public.readings
  for insert with check (true);

-- Allow anyone to read their own readings (or all for now if anonymous)
-- Ideally, you'd filter by a session ID or user ID. 
-- For this MVP, we might allow reading by ID or just open it up.
create policy "Enable select for all users" on public.readings
  for select using (true);
