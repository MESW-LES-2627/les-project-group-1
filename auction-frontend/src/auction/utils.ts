//Formats numbers as Euro currency with symbol at front(e.g., €50)
export const formatEuro = (amount: number) => `€${new Intl.NumberFormat('de-DE').format(amount)}`;

//Formats numbers as Euro currency with symbol at the end(e.g., 50€)
export const formatEuroSuffix = (amount: number) => `${new Intl.NumberFormat('de-DE').format(amount)} €`;

//Converts milliseconds to a short duration (e.g., "1 day 1 hour", "3 min 20s")
export const formatDuration = (ms: number): string => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? '' : 's'}`;

  if (days > 0) return `${plural(days, 'day')} ${plural(hours, 'hour')}`;
  if (hours > 0) return `${plural(hours, 'hour')} ${minutes} min`;
  if (minutes > 0) return `${minutes} min ${seconds}s`;
  return `${seconds}s`;
};

//Converts milliseconds to a human-readable time format (e.g., "1 day 1 hour left")
export const formatTimeLeft = (ms: number): string => (ms <= 0 ? 'Ended' : `${formatDuration(ms)} left`);

//Time until a scheduled auction opens (e.g., "Opens in 2 hours 5 min")
export const formatTimeUntilStart = (ms: number): string => (ms <= 0 ? 'Opening…' : `Opens in ${formatDuration(ms)}`);

//Formats a timestamp into a human-readable date and time
export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${month} ${date.getDate()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

//Converts a 2-letter country code into its corresponding flag emoji, or return a default flag if the code leeds to an error or is not provided
export const flagEmoji = (countryCode?: string) =>
  countryCode && countryCode.length === 2
    ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
    : '🏳️';

//Trucates an ID to its first 6 characters or return a dash placeholder if is empty ('-')
export const shortId = (id: string | null) => (id ? id.slice(0, 6) : '—');
