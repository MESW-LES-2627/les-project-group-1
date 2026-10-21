// Static data for the auctioned item, player info, and supported charities.
export const ITEM = {
  subtitle: 'The Urban Flare - The Ocean Surge',
  tags: ['worn', 'signed'],
  images: ['/jersey-front.png', '/jersey-back.png'],

  //Athele profile and jersey specidications.
  player: { 
    name: 'VELOCITY',
    nickname: 'The Urban Flare',
    age: 30,
    position: 'Midfielder',
    number: 10,
    size: 'M',
    nationality: 'Canadian',
    placeOfBirth: 'Canada',
    preferredFoot: 'Right',
  },

  //Charities supported by the auction.
  causes: [
    {
      name: 'Fundação Semear Futuro',
      description: '100% of proceeds support sports access for underpriveleged children.',
      logo: '/cause-semear-futuro.png',
    },
    {
      name: 'Play for All Foundation',
      description: 'Supporting youth sports and community programs.',
      logo: '/cause-play-for-all.png',
    },
  ],
};

//Minimum bid increment
export const MIN_INCREMENT = 1;
//Number of recent bids to display in the latest bids panel.
export const LATEST_BIDS_SHOWN = 5;
