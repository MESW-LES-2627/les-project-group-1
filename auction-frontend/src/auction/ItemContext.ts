import { createContext, useContext } from 'react';
import { ITEM } from './data';
import type { AuctionItem } from './types';

/**
 * Item context
 *
 * Carries the data of the item shown on the auction page (tags, subtitle, images, player and causes).
 * Without a provider, components get the prototype item from data.ts, so the Sprint 0 page keeps working.
 */
export const ItemContext = createContext<AuctionItem>(ITEM);

// Returns the item shown on the current page.
export const useItem = () => useContext(ItemContext);