export interface InfoItem {
  title: string;
  description: string;
}

export const MISSION =
  'Assist Club connects fans with authentic sports memorabilia while part of every sale goes to charity. Every item is verified before it reaches an auction, so you always know exactly what you are bidding on.';

export const STEPS: InfoItem[] = [
  {
    title: 'Discover',
    description: 'Browse verified memorabilia from clubs and athletes across many sports.',
  },
  {
    title: 'Bid live',
    description: 'Place your bids in real time and follow the auction until the last second.',
  },
  {
    title: 'Give back',
    description: 'Part of every sale goes to the charity linked to the item you won.',
  },
];

export const VALUES: InfoItem[] = [
  {
    title: 'Authenticity',
    description: 'Every item comes with a certificate and notes from the club that provided it.',
  },
  {
    title: 'Transparency',
    description: 'You can see every bid, every price and where the money goes.',
  },
  {
    title: 'Impact',
    description: 'Fans, clubs and charities all win with each auction.',
  },
];