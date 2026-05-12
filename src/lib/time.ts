export const dateAndTimeToStartsAt = (date: string, time: string) => {
  return new Date(`${date}T${time}:00.000Z`);
};

export const startsAtToDate = (startsAt: Date) => {
  return startsAt.toISOString().slice(0, 10);
};

export const startsAtToTime = (startsAt: Date) => {
  return startsAt.toISOString().slice(11, 16);
};
