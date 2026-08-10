// Indian-rupee + date formatting helpers, matching the wireframe.

export const INR = (n) =>
  '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export const toISODate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  // local date, no timezone shift (YYYY-MM-DD)
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 10);
};

export const today = () => toISODate(new Date());

// "12 Dec" — parse date-only strings at local midnight to avoid off-by-one.
export const shortDate = (isoOrDate) => {
  if (!isoOrDate) return '';
  const d =
    typeof isoOrDate === 'string'
      ? new Date(isoOrDate.slice(0, 10) + 'T00:00')
      : new Date(isoOrDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const longDate = (isoOrDate) => {
  if (!isoOrDate) return '';
  const d =
    typeof isoOrDate === 'string'
      ? new Date(isoOrDate.slice(0, 10) + 'T00:00')
      : new Date(isoOrDate);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// List of night Date objects for [checkIn, checkOut).
export function nightsBetween(inStr, outStr) {
  if (!inStr || !outStr) return [];
  const a = new Date(inStr.slice(0, 10) + 'T00:00');
  const b = new Date(outStr.slice(0, 10) + 'T00:00');
  if (!(a < b)) return [];
  const out = [];
  const d = new Date(a);
  while (d < b) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const nightCount = (inStr, outStr) => nightsBetween(inStr, outStr).length;
