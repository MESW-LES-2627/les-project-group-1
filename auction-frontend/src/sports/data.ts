export interface Sport {
  slug: string;
  name: string;
  description: string;
  image: string;
  items: number;
  liveAuctions: number;
}

export const SPORTS: Sport[] = [
  {
    slug: 'football',
    name: 'Football',
    description: "The world's game: shirts, boots and balls from clubs and legends.",
    image: '/sports/football.svg',
    items: 128,
    liveAuctions: 14,
  },
  {
    slug: 'basketball',
    name: 'Basketball',
    description: 'Signed jerseys and match-worn gear from courts around the world.',
    image: '/sports/basketball.svg',
    items: 64,
    liveAuctions: 6,
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    description: 'Rackets and kit from the biggest names on tour.',
    image: '/sports/tennis.svg',
    items: 41,
    liveAuctions: 4,
  },
  {
    slug: 'formula-1',
    name: 'Formula 1',
    description: 'Race suits, helmets and car parts straight from the paddock.',
    image: '/sports/formula-1.svg',
    items: 37,
    liveAuctions: 5,
  },
  {
    slug: 'rugby',
    name: 'Rugby',
    description: 'Match jerseys and balls from international fixtures.',
    image: '/sports/rugby.svg',
    items: 29,
    liveAuctions: 2,
  },
  {
    slug: 'cycling',
    name: 'Cycling',
    description: 'Race jerseys and equipment from the peloton.',
    image: '/sports/cycling.svg',
    items: 18,
    liveAuctions: 1,
  },
];