-- BLING MONEY MUSIC V2 - Partie 1 : droits complémentaires (titres et stockage)
-- À exécuter APRÈS partie1_base_de_donnees.sql. Ne supprime rien.

-- Titres : l'artiste pro envoie ses titres en attente ; les modérateurs les lisent et les publient
drop policy if exists tracks_artist_ins on public.tracks;
create policy tracks_artist_ins on public.tracks for insert to authenticated
  with check (public.owns_artist(artist_id) and status='pending');
drop policy if exists tracks_owner_sel on public.tracks;
create policy tracks_owner_sel on public.tracks for select to authenticated
  using (public.owns_artist(artist_id) or public.is_mod());
drop policy if exists tracks_mod_upd on public.tracks;
create policy tracks_mod_upd on public.tracks for update to authenticated
  using (public.is_mod()) with check (public.is_mod());

-- Stockage : pochettes/photos dans covers/artists/<ton id>/..., audio dans audio/<id artiste>/...
drop policy if exists bmm_covers_artist_ins on storage.objects;
create policy bmm_covers_artist_ins on storage.objects for insert to authenticated
  with check (bucket_id='covers' and (storage.foldername(name))[1]='artists'
              and (storage.foldername(name))[2]=auth.uid()::text);
drop policy if exists bmm_audio_artist_ins on storage.objects;
create policy bmm_audio_artist_ins on storage.objects for insert to authenticated
  with check (bucket_id='audio' and exists(select 1 from public.artists a
              where a.user_id=auth.uid() and a.id::text=(storage.foldername(name))[1]));
drop policy if exists bmm_audio_owner_sel on storage.objects;
create policy bmm_audio_owner_sel on storage.objects for select to authenticated
  using (bucket_id='audio' and (public.is_mod() or exists(select 1 from public.artists a
              where a.user_id=auth.uid() and a.id::text=(storage.foldername(name))[1])));
