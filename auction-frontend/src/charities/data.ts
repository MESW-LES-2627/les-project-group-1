export interface Charity {
  slug: string;
  name: string;
  cause: string;
  description: string;
  image: string;
  raised: number;
  auctions: number;
}

export const CHARITIES: Charity[] = [
  {
    slug: 'goal-for-kids',
    name: 'Goal for Kids',
    cause: 'Youth football',
    description: 'Free coaching and kit for children from low-income neighbourhoods.',
    image: '/charities/goal-for-kids.svg',
    raised: 12400,
    auctions: 8,
  },
  {
    slug: 'second-half-foundation',
    name: 'Second Half Foundation',
    cause: 'Rehabilitation',
    description: 'Helps retired athletes recover from injury and return to everyday life.',
    image: '/charities/second-half-foundation.svg',
    raised: 8650,
    auctions: 5,
  },
  {
    slug: 'pitch-perfect-community',
    name: 'Pitch Perfect Community',
    cause: 'Community spaces',
    description: 'Builds and repairs public football pitches in small towns.',
    image: '/charities/pitch-perfect-community.svg',
    raised: 15200,
    auctions: 11,
  },
  {
    slug: 'her-game',
    name: 'Her Game',
    cause: "Women's sport",
    description: "Funds girls' teams, referees and coaches across the country.",
    image: '/charities/her-game.svg',
    raised: 6300,
    auctions: 4,
  },
  {
    slug: 'open-stand',
    name: 'Open Stand',
    cause: 'Accessibility',
    description: 'Makes stadiums welcoming for fans with disabilities.',
    image: '/charities/open-stand.svg',
    raised: 9100,
    auctions: 6,
  },
  {
    slug: 'green-kick',
    name: 'Green Kick',
    cause: 'Environment',
    description: 'Plants a tree for every match played by partner clubs.',
    image: '/charities/green-kick.svg',
    raised: 4800,
    auctions: 3,
  },
];