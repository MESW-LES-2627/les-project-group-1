export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: 'Do I need an account to bid?',
    answer: 'You can browse every auction without an account, but you need to sign up and log in to place a bid.',
  },
  {
    question: 'How do I place a bid?',
    answer:
      'Open the auction, type an amount that is at least the minimum increment above the current bid and confirm. The new bid appears for everyone watching in real time.',
  },
  {
    question: 'What happens if I win an auction?',
    answer:
      'When the auction ends, the highest bidder receives a secure payment link. After the payment is confirmed you get an email and the item shows up in your profile.',
  },
  {
    question: 'How do I know an item is authentic?',
    answer:
      'Every item is verified before it is listed. Its page shows the authenticity notes and the certificate code provided by the club.',
  },
  {
    question: 'Where does the charity money go?',
    answer:
      'Part of every sale goes to the charity linked to the item. You can see all the charities we support, and how much each one has raised, on the Charities page.',
  },
  {
    question: 'How do I change my username, country or photo?',
    answer: 'Log in, open your profile from the navigation bar and edit your details there. Your email cannot be changed.',
  },
];

export const CONTACT_EMAIL = 'support@assistclub.example';
export const CONTACT_HOURS = 'Monday to Friday, 9:00 to 18:00. We usually reply within one working day.';