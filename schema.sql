-- Create tables with RLS (Row Level Security) enabled

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  bio text,
  tokens integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_token_refresh timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.users enable row level security;

-- RLS policies for users
create policy "Users can view their own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.users for update
  using ( auth.uid() = id );

create policy "Allow users to refresh their tokens"
  on public.users
  for all
  using (auth.uid() = id);

-- Songs table
create table public.songs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade,
  title text not null,
  audio_url text not null,
  genre text,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.songs enable row level security;

-- RLS policies for songs
create policy "Anyone can view songs"
  on public.songs for select
  using ( true );

create policy "Users can create their own songs"
  on public.songs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own songs"
  on public.songs for update
  using ( auth.uid() = user_id );

-- Likes table
create table public.likes (
  user_id uuid references public.users on delete cascade,
  song_id uuid references public.songs on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, song_id)
);

-- Enable RLS
alter table public.likes enable row level security;

-- RLS policies for likes
create policy "Users can view likes"
  on public.likes for select
  using ( true );

create policy "Users can like songs"
  on public.likes for insert
  with check ( auth.uid() = user_id );

-- Awards table
create table public.awards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Awards table
create table public.user_awards (
  user_id uuid references public.users on delete cascade,
  award_id uuid references public.awards on delete cascade,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, award_id)
);

-- Enable RLS
alter table public.user_awards enable row level security;

-- RLS policies for user awards
create policy "Anyone can view user awards"
  on public.user_awards for select
  using ( true );

-- Function to initialize new user with tokens
create or replace function public.initialize_new_user()
returns trigger as $$
begin
  insert into public.users (id, tokens)
  values (new.id, 2);  -- Give 2 tokens to new users
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to initialize new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.initialize_new_user();

-- Function to refresh tokens every 7 days
create or replace function public.refresh_user_tokens()
returns trigger as $$
declare
  last_refresh timestamp with time zone;
  days_since_refresh integer;
begin
  -- Get the last refresh time
  select last_token_refresh into last_refresh
  from public.users
  where id = auth.uid();
  
  -- Calculate days since last refresh
  days_since_refresh := extract(day from (now() - last_refresh));
  
  -- If it's been 7 or more days since last refresh
  if days_since_refresh >= 7 then
    -- Add 2 tokens and update last_token_refresh
    update public.users
    set tokens = tokens + 2,
        last_token_refresh = now()
    where id = auth.uid();
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a function to check and refresh tokens that can be called from the client
create or replace function public.check_and_refresh_tokens()
returns void as $$
begin
  perform public.refresh_user_tokens();
end;
$$ language plpgsql security definer;

-- Functions
create or replace function public.increment_likes(song_id uuid)
returns void as $$
begin
  update public.songs
  set likes_count = likes_count + 1
  where id = song_id;
end;
$$ language plpgsql security definer;

create or replace function public.add_tokens(user_id uuid, amount integer)
returns void as $$
begin
  update public.users
  set tokens = tokens + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

create or replace function public.use_tokens(user_id uuid, amount integer)
returns boolean as $$
declare
  current_tokens integer;
begin
  select tokens into current_tokens
  from public.users
  where id = user_id;

  if current_tokens >= amount then
    update public.users
    set tokens = tokens - amount
    where id = user_id;
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;

-- Storage buckets
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
