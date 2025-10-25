export default function timeSinceString(time) {
  const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
  };

  const diff = Date.now() - time;

  if (diff > periods.month) {
    // it was at least a month ago
    return Math.floor(diff / periods.month) + 'mo ago';
  } else if (diff > periods.week) {
    return Math.floor(diff / periods.week) + 'w ago';
  } else if (diff > periods.day) {
    return Math.floor(diff / periods.day) + 'd ago';
  } else if (diff > periods.hour) {
    return Math.floor(diff / periods.hour) + 'h ago';
  } else if (diff > periods.minute) {
    return Math.floor(diff / periods.minute) + 'm ago';
  }
  return 'Just now';
}