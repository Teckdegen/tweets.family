const two = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function money(value: number) {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString("en-US", two)}`;
}

export function signedMoney(value: number) {
  return `${value < 0 ? "-" : "+"}$${Math.abs(value).toLocaleString("en-US", two)}`;
}

// "$2,138,608" and ".88" separately, so the cents can be dimmed
export function moneyParts(value: number) {
  const [whole, cents] = money(value).split(".");
  return { whole, cents: `.${cents}` };
}

export function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function timeAgo(iso: string, now: number) {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
