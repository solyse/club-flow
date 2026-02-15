/**
 * Parse date-only string (YYYY-MM-DD) as calendar date so it displays the same in all timezones.
 * With new Date("2026-03-04"), JS treats it as UTC midnight, so in US Pacific it becomes March 3.
 * This helper parses YYYY-MM-DD as local calendar date so "2026-03-04" always shows as March 4.
 */
export function parseDateOnly(dateString: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateString);
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '';

  try {
    const date = parseDateOnly(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

export function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return '';
  if (!endDate) return formatDate(startDate);
  if (!startDate) return formatDate(endDate);

  try {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const month = start.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = start.getFullYear();
      return `${month} ${startDay}–${endDay}, ${year}`;
    }

    if (start.getFullYear() === end.getFullYear()) {
      const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
      const endDay = end.getDate();
      const year = start.getFullYear();
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
    }

    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  } catch (error) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
}
