-- Demo data: esports jerseys. Safe to run many times (conflicts are ignored).

insert into clubs (slug, name, description) values
  ('nexus-gaming', 'Nexus Gaming', 'Esports organisation known for its fast and aggressive style of play.'),
  ('orange-energy', 'Orange Energy', 'Esports organisation with a strong youth academy and a loyal fan base.'),
  ('razer-networks', 'Razer Networks', 'Esports organisation competing in several international tournaments.'),
  ('golden-gear', 'Golden Gear', 'Veteran esports organisation with a long list of titles.'),
  ('viper', 'Viper', 'Esports organisation famous for its precise and patient style of play.'),
  ('vortex-esports', 'Vortex Esports', 'Esports organisation with a large and passionate community.'),
  ('flow', 'Flow', 'Esports organisation focused on teamwork and live streaming.'),
  ('cosmic-stream', 'Cosmic Stream', 'Content and esports organisation with a collection of special editions.'),
  ('outpost', 'Outpost', 'Esports organisation with a dedicated fan base and a strong home crowd.'),
  ('vanguard', 'Vanguard', 'Esports organisation that led the league in recent seasons.')
on conflict (slug) do nothing;

-- Categories follow the jersey type. Tags (worn, signed, final, limited) describe each item.
insert into categories (slug, name) values
  ('player-jerseys', 'Player jerseys'),
  ('team-jerseys', 'Team jerseys'),
  ('special-editions', 'Special editions')
on conflict (slug) do nothing;

insert into listings
  (club_id, category_id, title, player_name, player_details, season, competition, tags,
   description, images, status, authenticity_notes, certificate_code, verified_at,
   starting_price, auction_ends_at)
values
  ((select id from clubs where slug = 'nexus-gaming'),
   (select id from categories where slug = 'team-jerseys'),
   'Nexus Gaming Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn'],
   'Team jersey worn on stage by Nexus Gaming during the group stage of the Atlantic Esports League.',
   array['/nexus-gaming-front.png', '/nexus-gaming-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0001', now(),
   220, now() + interval '30 seconds'),

  ((select id from clubs where slug = 'orange-energy'),
   (select id from categories where slug = 'team-jerseys'),
   'Orange Energy Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn', 'signed'],
   'Team jersey worn by Orange Energy in the quarter-finals of the Atlantic Esports League and signed by the full roster.',
   array['/orange-energy-front.png', '/orange-energy-back.png'],
   'verified', 'Signing session witnessed by team staff. Matched against official broadcast footage.', 'AC-2026-0002', now(),
   340, now() + interval '1 day 4 hours'),

  ((select id from clubs where slug = 'razer-networks'),
   (select id from categories where slug = 'team-jerseys'),
   'Razer Networks Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn'],
   'Team jersey worn by Razer Networks during the regular season of the Atlantic Esports League.',
   array['/razer-networks-front.png', '/razer-networks-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0003', now(),
   260, now() + interval '2 days'),

  ((select id from clubs where slug = 'golden-gear'),
   (select id from categories where slug = 'player-jerseys'),
   'Golden Gear Player Jersey', 'Golden',
   '{"nickname":"The Gear","age":24,"position":"Entry fragger","number":77,"size":"M","nationality":"Portuguese","placeOfBirth":"Leiria","preferredFoot":"N/A"}'::jsonb,
   '2026', 'Atlantic Esports League', array['worn', 'signed', 'final'],
   'Player jersey number 77 worn by Golden in the grand final of the Atlantic Esports League and signed by the player afterwards.',
   array['/golden-gear-front.png', '/golden-gear-back.png'],
   'verified', 'Matched against official broadcast footage. Signature checked against team records.', 'AC-2026-0004', now(),
   450, now() + interval '12 hours'),

  ((select id from clubs where slug = 'viper'),
   (select id from categories where slug = 'player-jerseys'),
   'Viper Player Jersey', 'Viper',
   '{"nickname":"The Fang","age":22,"position":"Sniper","number":21,"size":"L","nationality":"Portuguese","placeOfBirth":"Viseu","preferredFoot":"N/A"}'::jsonb,
   '2026', 'Atlantic Esports League', array['worn'],
   'Player jersey number 21 worn by Viper in the semi-final of the Atlantic Esports League.',
   array['/viper-front.png', '/viper-back.png'],
   'verified', 'Matched against official broadcast footage. Letter from the team coach attached.', 'AC-2026-0005', now(),
   380, now() + interval '5 days'),

  ((select id from clubs where slug = 'vortex-esports'),
   (select id from categories where slug = 'team-jerseys'),
   'Vortex Esports Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn', 'signed'],
   'Team jersey worn by Vortex Esports in the opening match of the season and signed by the full roster.',
   array['/vortex-esports-front.png', '/vortex-esports-back.png'],
   'verified', 'Signing session witnessed by team staff. Matched against official broadcast footage.', 'AC-2026-0006', now(),
   300, now() + interval '8 hours'),

  ((select id from clubs where slug = 'flow'),
   (select id from categories where slug = 'team-jerseys'),
   'Flow Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn'],
   'Team jersey worn by Flow on stage during the group stage of the Atlantic Esports League.',
   array['/flow-front.png', '/flow-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0007', now(),
   180, now() + interval '3 days'),

  ((select id from clubs where slug = 'cosmic-stream'),
   (select id from categories where slug = 'special-editions'),
   'Cosmic Stream Limited Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['limited'],
   'Limited edition jersey released by Cosmic Stream to celebrate the opening of the season.',
   array['/cosmic-stream-front.png'],
   'verified', 'Original team issue. Certificate provided by the organisation.', 'AC-2026-0008', now(),
   600, now() + interval '10 days'),

  ((select id from clubs where slug = 'outpost'),
   (select id from categories where slug = 'team-jerseys'),
   'Outpost Team Jersey', null, null::jsonb,
   '2026', 'Atlantic Esports League', array['worn', 'final'],
   'Team jersey worn by Outpost in the final of the Atlantic Esports League.',
   array['/outpost-front.png', '/outpost-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0009', now(),
   420, now() + interval '6 days'),

  ((select id from clubs where slug = 'vanguard'),
   (select id from categories where slug = 'player-jerseys'),
   'Vanguard Player Jersey', 'Vanguard',
   '{"nickname":"The Captain","age":27,"position":"In-game leader","number":7,"size":"M","nationality":"Portuguese","placeOfBirth":"Guarda","preferredFoot":"N/A"}'::jsonb,
   '2026', 'Atlantic Esports League', array['worn', 'signed'],
   'Player jersey number 07 worn by Vanguard in the final of the Atlantic Esports League and signed by the player afterwards.',
   array['/vanguard-front.png', '/vanguard-back.png'],
   'verified', 'Signing witnessed by team staff. Matched against official broadcast footage.', 'AC-2026-0010', now(),
   520, now() + interval '4 days')
on conflict (title) do nothing;

-- Not verified yet: must NOT appear in the public catalogue.
insert into listings
  (club_id, category_id, title, player_name, season, competition, tags, description, images, status)
values
  ((select id from clubs where slug = 'vortex-esports'),
   (select id from categories where slug = 'team-jerseys'),
   'Vortex Esports Training Jersey', null, '2026', 'Atlantic Esports League', array['worn'],
   'Training jersey submitted by the team and waiting for administrator review.',
   array['/vortex-esports-front.png', '/vortex-esports-back.png'], 'pending_verification')
on conflict (title) do nothing;