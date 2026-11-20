import { describe, expect, it } from 'bun:test';
import {
  JERSEY_DETAIL_FIELDS,
  PLAYER_ONLY_FIELDS,
  buildDetails,
  categoryHasPlayer,
  emptyForm,
  formFromListing,
  formToFields,
  withoutPlayerFields,
} from '../src/dashboard/lib/listing-form';
import type { MyListing } from '../src/dashboard/lib/club-api';

// A saved player jersey, as the API returns it
function savedListing(overrides: Partial<MyListing> = {}): MyListing {
  return {
    categoryId: 1,
    title: 'Signed shirt',
    description: 'Signed by the captain.',
    playerName: 'Test Player',
    playerDetails: { size: 'L', age: 30, position: 'Forward' },
    season: null,
    competition: null,
    match: null,
    tags: [],
    authenticityNotes: null,
    startingPrice: null,
    auctionEndsAt: null,
    ...overrides,
  } as MyListing;
}

describe('player detail fields', () => {
  it('keeps size as the only jersey field, shown for every category', () => {
    expect(JERSEY_DETAIL_FIELDS.map((field) => field.key)).toEqual(['size']);
  });

  it('marks every other field as player-only', () => {
    expect(PLAYER_ONLY_FIELDS.map((field) => field.key)).toEqual([
      'nickname',
      'age',
      'position',
      'number',
      'nationality',
      'placeOfBirth',
      'preferredFoot',
    ]);
  });
});

describe('categoryHasPlayer', () => {
  it('is false only for team jerseys', () => {
    expect(categoryHasPlayer('team-jerseys')).toBe(false);
    expect(categoryHasPlayer('player-jerseys')).toBe(true);
    expect(categoryHasPlayer('special-editions')).toBe(true);
  });

  it('shows the player fields while no category is chosen', () => {
    expect(categoryHasPlayer(undefined)).toBe(true);
  });
});

describe('withoutPlayerFields', () => {
  it('empties the player name and keeps only the size', () => {
    const values = { ...emptyForm(), playerName: 'Test Player', playerDetails: { size: 'M', age: '30', position: 'GK' } };

    const result = withoutPlayerFields(values);

    expect(result.playerName).toBe('');
    expect(result.playerDetails).toEqual({ size: 'M' });
  });

  it('does not change the values it was given', () => {
    const values = { ...emptyForm(), playerName: 'Test Player', playerDetails: { age: '30' } };

    withoutPlayerFields(values);

    expect(values.playerName).toBe('Test Player');
    expect(values.playerDetails).toEqual({ age: '30' });
  });
});

describe('buildDetails', () => {
  it('sends age and shirt number as numbers and leaves out empty fields', () => {
    expect(buildDetails({ age: '30', number: '10', position: ' Forward ', nickname: '  ' }, null)).toEqual({
      age: 30,
      number: 10,
      position: 'Forward',
    });
  });

  it('returns null when nothing is filled in', () => {
    expect(buildDetails({ age: '', size: '' }, null)).toBeNull();
  });
});

describe('formToFields when creating', () => {
  const filled = {
    ...emptyForm(),
    categoryId: '2',
    title: 'Squad shirt',
    description: 'Signed by the whole squad.',
    playerName: 'Test Player',
    playerDetails: { size: 'L', age: '30', position: 'Forward' },
  };

  it('sends the player name and details for a player jersey', () => {
    const fields = formToFields(filled, emptyForm(), null, true);

    expect(fields.playerName).toBe('Test Player');
    expect(JSON.parse(fields.playerDetails)).toEqual({ size: 'L', age: 30, position: 'Forward' });
  });

  it('drops the player name and player-only details for a team jersey', () => {
    const fields = formToFields(filled, emptyForm(), null, false);

    expect(fields.playerName).toBeUndefined();
    expect(JSON.parse(fields.playerDetails)).toEqual({ size: 'L' });
  });

  it('sends only the filled-in fields', () => {
    const fields = formToFields({ ...emptyForm(), title: 'Only a title' }, emptyForm());

    expect(fields).toEqual({ title: 'Only a title' });
  });

  it('sends tags as a JSON list without duplicates', () => {
    const fields = formToFields({ ...emptyForm(), tags: 'signed, worn, signed,' }, emptyForm());

    expect(JSON.parse(fields.tags)).toEqual(['signed', 'worn']);
  });
});

describe('formToFields when editing', () => {
  it('sends nothing when nothing changed', () => {
    const listing = savedListing();
    const initial = formFromListing(listing);

    expect(formToFields(initial, initial, listing)).toEqual({});
  });

  it('clears the player name and details when the listing becomes a team jersey, keeping the size', () => {
    const listing = savedListing();
    const initial = formFromListing(listing);

    const fields = formToFields({ ...initial, categoryId: '2' }, initial, listing, false);

    expect(fields.categoryId).toBe('2');
    expect(fields.playerName).toBe('');
    expect(JSON.parse(fields.playerDetails)).toEqual({ size: 'L' });
  });

  it('sends an empty value to clear a field that was emptied', () => {
    const listing = savedListing({ season: '2024/25' });
    const initial = formFromListing(listing);

    expect(formToFields({ ...initial, season: '' }, initial, listing)).toEqual({ season: '' });
  });
});
