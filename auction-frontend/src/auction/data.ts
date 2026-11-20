// Static data for the auctioned item, player info, and supported charities.
export const ITEM = {
  subtitle: 'The Urban Flare - The Ocean Surge',
  tags: ['Worn', 'Signed'],
  images: ['/jersey-front.png', '/jersey-back.png'],

  //Athele profile and jersey specidications.
  player: { 
    name: 'Velocity',
    nickname: 'The Urban Flare',
    age: 30,
    position: 'Midfielder',
    number: 10,
    size: 'M',
    nationality: 'Canadian',
    placeOfBirth: 'Canada',
    preferredFoot: 'Right',
  },

  //Team that provided the item.
  club: {
    name: 'Nexus Gaming',
    logoUrl: null,
  },

  //Verified charity supported by the demo auction.
  causes: [
    {
      name: 'Right to Play',
      description: 'Uses play and sport to help children build life skills, stay in school and recover from adversity.',
      logo: '/images/charities/right-to-play.png',
      country: 'CA',
      donationPercentage: 10,
    },
  ],
};

//Minimum bid increment
export const MIN_INCREMENT = 1;
//Number of recent bids to display in the latest bids panel.
export const LATEST_BIDS_SHOWN = 3;
