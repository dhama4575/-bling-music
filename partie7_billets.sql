-- BLING MONEY MUSIC V2 - BILLETS ÉLECTRONIQUES (QR code), CONTRÔLE À L'ENTRÉE, SUIVI DES VENTES
-- Prérequis : Partie 2 (concerts et billets) exécutée. Ne supprime rien.
-- Le billet validé à l'entrée passe en « utilisé » : un second scan est refusé. Seul l'organisateur du concert
-- (ou un modérateur) peut contrôler ses billets. La délégation à du personnel d'accueil est à développer.

alter table public.tickets add column if not exists used_at timestamptz;
alter table public.tickets add column if not exists used_by uuid references auth.users(id);

-- Journal de tous les contrôles, y compris les billets refusés
create table if not exists public.ticket_scans(
  id bigint generated always as identity primary key,
  ticket_id uuid references public.tickets(id),
  concert_id uuid references public.concerts(id),
  code_tried text,
  scanner uuid references auth.users(id),
  result text not null,
  created_at timestamptz not null default now());
create index if not exists ticket_scans_concert_idx on public.ticket_scans(concert_id,created_at desc);

-- Contrôle d'un billet à l'entrée : valide, déjà utilisé, autre concert ou invalide
create or replace function public.scan_ticket(p_code text,p_concert uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t tickets; c concerts; code text:=upper(trim(coalesce(p_code,'')));
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if left(code,6)='BLING:' then code:=substr(code,7); end if;
  select * into t from tickets where tickets.code=scan_ticket.code;
  if found then select * into c from concerts where id=t.concert_id; end if;
  -- Un contrôleur non autorisé reçoit « invalide », sans savoir si le billet existe
  if not found or not (c.organizer_id=auth.uid() or is_mod()) then
    insert into ticket_scans(concert_id,code_tried,scanner,result) values(p_concert,left(code,40),auth.uid(),'invalid');
    return jsonb_build_object('result','invalid');
  end if;
  if p_concert is not null and t.concert_id<>p_concert then
    insert into ticket_scans(ticket_id,concert_id,code_tried,scanner,result) values(t.id,t.concert_id,code,auth.uid(),'wrong_concert');
    return jsonb_build_object('result','wrong_concert','concert',c.title);
  end if;
  if t.status='used' then
    insert into ticket_scans(ticket_id,concert_id,code_tried,scanner,result) values(t.id,t.concert_id,code,auth.uid(),'already_used');
    return jsonb_build_object('result','already_used','used_at',t.used_at,'concert',c.title);
  end if;
  if t.status<>'valid' then
    insert into ticket_scans(ticket_id,concert_id,code_tried,scanner,result) values(t.id,t.concert_id,code,auth.uid(),'invalid');
    return jsonb_build_object('result','invalid');
  end if;
  update tickets set status='used',used_at=now(),used_by=auth.uid() where id=t.id and status='valid';
  if not found then
    return jsonb_build_object('result','already_used','concert',c.title);
  end if;
  insert into ticket_scans(ticket_id,concert_id,code_tried,scanner,result) values(t.id,t.concert_id,code,auth.uid(),'ok');
  return jsonb_build_object('result','ok','concert',c.title,'price',t.price_fcfa);
end $$;

-- Ventes, entrées et commissions de chaque concert de l'organisateur
create or replace function public.my_concert_sales()
returns table(concert_id uuid,title text,starts_at timestamptz,status text,price_fcfa bigint,capacity int,
              sold bigint,entered bigint,gross bigint,organizer_share bigint,platform_share bigint)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  return query
    select c.id,c.title::text,c.starts_at,c.status::text,c.price_fcfa,c.capacity,
      count(t.id) filter (where t.status<>'refunded'),
      count(t.id) filter (where t.status='used'),
      coalesce(sum(t.price_fcfa) filter (where t.status<>'refunded'),0)::bigint,
      coalesce(sum(t.organizer_share) filter (where t.status<>'refunded'),0)::bigint,
      coalesce(sum(t.platform_share) filter (where t.status<>'refunded'),0)::bigint
    from concerts c left join tickets t on t.concert_id=c.id
    where c.organizer_id=auth.uid() or is_admin()
    group by c.id order by c.starts_at desc;
end $$;

alter table public.ticket_scans enable row level security;
drop policy if exists tsc_sel on public.ticket_scans;
create policy tsc_sel on public.ticket_scans for select to authenticated
  using (is_mod() or exists(select 1 from concerts c where c.id=concert_id and c.organizer_id=auth.uid()));

revoke execute on function public.scan_ticket(text,uuid),public.my_concert_sales() from public,anon;
