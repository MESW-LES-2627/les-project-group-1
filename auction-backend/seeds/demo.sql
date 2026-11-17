-- Demo data: football jerseys. Safe to run many times: existing rows are updated
-- from this file, so `bun run seed` also refreshes an already-seeded database.

insert into clubs (slug, name, description, logo_url) values
  ('sl-benfica', 'SL Benfica', 'Portuguese football club based in Lisbon, with a record number of league titles and a passionate worldwide following.', '/images/clubs/sl-benfica.svg'),
  ('santos-fc', 'Santos FC', 'Brazilian football club from Santos, famous for its youth academy and for producing some of the game''s greatest players.', '/images/clubs/santos-fc.svg'),
  ('houston-dash-women', 'Houston Dash (Women)', 'American women''s football club based in Houston, competing in the National Women''s Soccer League.', '/images/clubs/houston-dash-women.svg'),
  ('ac-milan', 'AC Milan', 'Italian football club based in Milan, with a long history of domestic and European titles.', '/images/clubs/ac-milan.svg'),
  ('arsenal', 'Arsenal', 'English football club based in London, known for its attacking style and long top-flight tradition.', '/images/clubs/arsenal.svg'),
  ('rc-celta', 'RC Celta de Vigo', 'Spanish football club based in Vigo, with a proud identity and a passionate local support.', '/images/clubs/rc-celta.svg'),
  ('liverpool-fc', 'Liverpool FC', 'English football club based in Liverpool, with a rich history of domestic and European success.', '/images/clubs/liverpool-fc.svg'),
  ('portugal', 'Portugal', 'National team representing Portugal, with a growing collection of international honours and special-edition shirts.', '/images/clubs/portugal.svg'),
  ('sc-braga', 'SC Braga', 'Portuguese football club based in Braga, known for its strong home support and regular European appearances.', '/images/clubs/sc-braga.svg'),
  ('celtic', 'Celtic', 'Scottish football club based in Glasgow, with a long record of league titles and a famous home atmosphere.', '/images/clubs/celtic.svg')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  logo_url = excluded.logo_url;

-- Categories follow the jersey type. Tags (worn, signed, final, limited) describe each item.
insert into categories (slug, name) values
  ('player-jerseys', 'Player jerseys'),
  ('team-jerseys', 'Team jerseys'),
  ('special-editions', 'Special editions')
on conflict (slug) do update set
  name = excluded.name;

insert into listings
  (club_id, category_id, title, player_name, player_details, season, competition, match, tags,
   description, images, status, authenticity_notes, certificate_code, verified_at,
   starting_price, auction_ends_at)
values
  ((select id from clubs where slug = 'sl-benfica'),
   (select id from categories where slug = 'team-jerseys'),
   'SL Benfica Squad Signed Shirt', null, null::jsonb,
   '2026/27', 'UEFA Europa League', 'SL Benfica vs Celtic', array['signed'],
   'This is a fan shop shirt signed by members of this season''s squad. The signatures on this shirt are from the players called up for SL Benfica - Celtic, 15-10-2026, for the UEFA Europa League.',
   array['/images/items/sl-benfica/squad-front.png', '/images/items/sl-benfica/squad-back.png'],
   'verified', 'Matched against real signatures. Provided by the team manager.', 'AC-2026-0001', now(),
   220, now() + interval '30 seconds'),

  ((select id from clubs where slug = 'santos-fc'),
   (select id from categories where slug = 'team-jerseys'),
   'Santos FC Squad Signed Shirt', null, null::jsonb,
   '2026', 'Brasileiro Série A', 'Santos FC vs Athletico PR', array['worn', 'signed'],
   'This is a fan shop shirt signed by members of this season''s squad. The signatures on this shirt are from the players called up for Santos FC - Athletico PR, 02-09-2026, for the Brasileiro Série A.',
   array['/images/items/santos-fc/squad-front.avif', '/images/items/santos-fc/squad-back.avif'],
   'verified', 'Signing session witnessed by team staff. Provided by the kitman.', 'AC-2026-0002', now(),
   340, now() + interval '1 day 4 hours'),

  ((select id from clubs where slug = 'houston-dash-women'),
   (select id from categories where slug = 'player-jerseys'),
   'Miljana Ivanović', 'M. Ivanović',
   '{"age":26,"position":"Left Wing","number":47,"size":"S","nationality":"Serbian","placeOfBirth":"Serbia","preferredFoot":"Right"}'::jsonb,
   '2026', 'NWSL', 'Houston Dash vs Gotham FC', array['worn', 'signed', 'final'],
   'Player jersey number 47 worn by Miljana Ivanović in the grand final of the NWSL and signed by the player afterwards.',
   array['/images/items/houston-dash-women/ivanovic-front.png', '/images/items/houston-dash-women/ivanovic-back.png'],
   'verified', 'Matched against official broadcast footage. Signature checked against team records.', 'AC-2026-0003', now(),
   450, now() + interval '12 hours'),

  ((select id from clubs where slug = 'ac-milan'),
   (select id from categories where slug = 'player-jerseys'),
   'Gonçalo Ramos', 'G. Ramos',
   '{"age":25,"position":"Striker","number":9,"size":"L","nationality":"Portuguese","placeOfBirth":"Portugal","preferredFoot":"N/A"}'::jsonb,
   '2026/27', 'UEFA Europa League', 'AC Milan vs Ferencvaros', array['worn'],
   'This AC Milan football shirt was worn by Gonçalo Ramos in the UEFA Europa League meeting with Ferencváros on 5 November 2026. The match took place at Stadio Giuseppe Meazza, where Milan finished with a 0–2 scoreline. The number nine shirt connects Ramos to a specific European night in the 2026/27 season.',
   array['/images/items/ac-milan/ramos-front.png', '/images/items/ac-milan/ramos-back.png'],
   'verified', 'Matched against official broadcast footage. Signature checked against team records.', 'AC-2026-0004', now(),
   450, now() + interval '12 hours'),

  ((select id from clubs where slug = 'arsenal'),
   (select id from categories where slug = 'player-jerseys'),
   'Gabriel Magalhães', 'Gabriel M.',
   '{"age":28,"position":"Defender","number":6,"size":"L","nationality":"Brazilian","placeOfBirth":"Brazil","preferredFoot":"N/A"}'::jsonb,
   '2026/27', 'UEFA Champions League', 'FC Bayern vs Arsenal', array['worn'],
   'This official Arsenal football shirt was worn by Gabriel Magalhães during the UEFA Champions League match against FC Bayern München at the Allianz Arena on 21 October 2026. The defender started the fixture, which finished in a 2–2 draw.',
   array['/images/items/arsenal/gabriel-front.png', '/images/items/arsenal/gabriel-back.png'],
   'verified', 'Matched against official broadcast footage. Letter from the team coach attached.', 'AC-2026-0005', now(),
   380, now() + interval '5 days'),

  ((select id from clubs where slug = 'rc-celta'),
   (select id from categories where slug = 'team-jerseys'),
   'RC Celta Squad Signed Shirt', null, null::jsonb,
   '2026/27', 'LaLiga EA SPORTS', 'RC Celta vs Levante UD', array['signed'],
   'This is a fan shop shirt signed by members of this season''s squad.',
   array['/images/items/rc-celta/squad-front.png', '/images/items/rc-celta/squad-back.png'],
   'verified', 'Signing session witnessed by team staff. Matched against official broadcast footage.', 'AC-2026-0006', now(),
   300, now() + interval '8 hours'),

  ((select id from clubs where slug = 'liverpool-fc'),
   (select id from categories where slug = 'player-jerseys'),
   'Florian Wirtz', 'F. Wirtz', '{"age":23,"position":"Midfielder","number":7,"size":"S","nationality":"German","placeOfBirth":"Germany","preferredFoot":"N/A"}'::jsonb,
   '2026/27', 'Premier League', 'Liverpool FC vs Arsenal FC', array['worn', 'signed'],
   'This official Liverpool shirt was worn by Florian Wirtz during the Premier League match against Arsenal at Anfield on 1 November 2026.',
   array['/images/items/liverpool-fc/wirtz-front.png', '/images/items/liverpool-fc/wirtz-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0007', now(),
   180, now() + interval '3 days'),

  ((select id from clubs where slug = 'portugal'),
   (select id from categories where slug = 'special-editions'),
   'Classic Framed Squad Signed Eusébio Shirt', null, null::jsonb,
   '2025', 'UEFA Nations League', 'Portugal vs Armenia', array['limited', 'signed'],
   'This handcrafted, luxurious frame is made from high-quality, locally sourced materials and showcases a squad-signed fan shop shirt.',
   array['/images/items/portugal/framed-front.png'],
   'verified', 'Original team issue. Certificate provided by the organisation.', 'AC-2026-0008', now(),
   600, now() + interval '10 days'),

  ((select id from clubs where slug = 'sc-braga'),
   (select id from categories where slug = 'team-jerseys'),
   'SC Braga Squad Signed Shirt', null, null::jsonb,
   '2026/27', 'UEFA Conference League', 'Aarhus GF vs SC Braga', array['signed'],
   'This is a fan shop shirt signed by members of this season''s squad.',
   array['/images/items/sc-braga/squad-front.png', '/images/items/sc-braga/squad-back.png'],
   'verified', 'Matched against official broadcast footage. Provided by the team manager.', 'AC-2026-0009', now(),
   420, now() + interval '6 days'),

  ((select id from clubs where slug = 'celtic'),
   (select id from categories where slug = 'player-jerseys'),
   'Kieran Tierney', 'Tierney',
   '{"age":29,"position":"Defender","number":63,"size":"S","nationality":"Scottish","placeOfBirth":"Scotland","preferredFoot":"N/A"}'::jsonb,
   '2026', 'UEFA Europa League', 'Celtic vs Beşiktaş JK', array['worn', 'signed'],
   'This Celtic football shirt was match-worn by Kieran Tierney in the UEFA Europa League match against Beşiktaş JK at Celtic Park on 5 November 2026. A starting defender wearing number 63, Tierney was part of the 3–2 victory.',
   array['/images/items/celtic/tierney-front.png', '/images/items/celtic/tierney-back.png'],
   'verified', 'Signing witnessed by team staff. Matched against official broadcast footage.', 'AC-2026-0010', now(),
   520, now() + interval '4 days')
on conflict (certificate_code) do update set
  club_id = excluded.club_id,
  category_id = excluded.category_id,
  title = excluded.title,
  player_name = excluded.player_name,
  player_details = excluded.player_details,
  season = excluded.season,
  competition = excluded.competition,
  match = excluded.match,
  tags = excluded.tags,
  description = excluded.description,
  images = excluded.images,
  status = excluded.status,
  authenticity_notes = excluded.authenticity_notes,
  verified_at = excluded.verified_at,
  starting_price = excluded.starting_price,
  auction_ends_at = excluded.auction_ends_at;