export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const todayIso = (): string => toIsoDate(new Date());

export const displayDate = (date: string, options?: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(`${date}T12:00:00`));

export const relativeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
