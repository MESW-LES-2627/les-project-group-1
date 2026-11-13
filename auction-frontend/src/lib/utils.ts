import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

//Converts a 2-letter country code into its corresponding flag emoji, or return a default flag if the code leeds to an error or is not provided
export const flagEmoji = (countryCode?: string) =>
    countryCode && countryCode.length === 2
        ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
        : '🏳️';