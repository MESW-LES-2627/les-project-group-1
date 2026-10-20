export const formatEuro = (amount: number) => `€${new Intl.NumberFormat('de-DE').format(amount)}`;

export const formatEuroSuffix = (amount: number) => `${new Intl.NumberFormat('de-DE').format(amount)} €`;

export const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return 'Ended';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? '' : 's'}`;

  if (days > 0) return `${plural(days, 'day')} ${plural(hours, 'hour')} left`;
  if (hours > 0) return `${plural(hours, 'hour')} ${minutes} min left`;
  if (minutes > 0) return `${minutes} min ${seconds}s left`;
  return `${seconds}s left`;
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${month} ${date.getDate()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const flagEmoji = (countryCode?: string) =>
  countryCode && countryCode.length === 2
    ? String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
    : '🏳️';

export const shortId = (id: string | null) => (id ? id.slice(0, 6) : '—');
