// components/goalData.ts

export type DeadlineType =
  | "HOURLY"
  | "AT_TIME"
  | "DAILY_EOD"
  | "WEEKLY_EOW"
  | "MONTHLY_EOM";

export type ShortTermGoal = {
  id: string;
  title: string;
  category: string;
  deadlineType: DeadlineType;
  deadlineTime?: string;
};

export const USER_END_OF_DAY = "23:00";

export const categoryColors: Record<string, string> = {
  "Career & Skills": "#4DA3FF",
  "Hobbies": "#B57BFF",
  "Health & Fitness": "#6BFF6B",
  "Relationships & Social": "#FF7BAA",
  default: "#AAAAAA",
};

export const categories = [
  "Career & Skills",
  "Hobbies",
  "Health & Fitness",
  "Relationships & Social",
];

export const initialGoals: ShortTermGoal[] = [
  { id: "career-1", title: "Interview prep for one hour", category: "Career & Skills", deadlineType: "DAILY_EOD" },
  { id: "career-2", title: "Earn Trailhead badge", category: "Career & Skills", deadlineType: "WEEKLY_EOW" },
  { id: "career-3", title: "Follow the 7 habits to impact", category: "Career & Skills", deadlineType: "DAILY_EOD" },

  { id: "hobby-1", title: "Practice drums", category: "Hobbies", deadlineType: "DAILY_EOD" },
  { id: "hobby-2", title: "Edit photo", category: "Hobbies", deadlineType: "MONTHLY_EOM" },
  { id: "hobby-3", title: "Read", category: "Hobbies", deadlineType: "DAILY_EOD" },

  { id: "fit-1", title: "Positive training load", category: "Health & Fitness", deadlineType: "WEEKLY_EOW" },
  { id: "fit-2", title: "Eat healthy", category: "Health & Fitness", deadlineType: "DAILY_EOD" },
  { id: "fit-3", title: "Abstain", category: "Health & Fitness", deadlineType: "DAILY_EOD" },
  { id: "fit-4", title: "Take medicines", category: "Health & Fitness", deadlineType: "AT_TIME", deadlineTime: "21:30" },

  { id: "rel-1", title: "Find out something new about someone", category: "Relationships & Social", deadlineType: "DAILY_EOD" },
];

/* ----- deadline math ----- */

function parseHM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return { h, m };
}

export function endOfToday(eod: string) {
  const now = new Date();
  const { h, m } = parseHM(eod);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

export function nextSpecificTime(hhmm: string) {
  const now = new Date();
  const { h, m } = parseHM(hhmm);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

export function endOfCurrentWeek() {
  const now = new Date();
  const d = new Date(now);
  const diff = 6 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function endOfCurrentMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function nextHourEnd() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(now.getHours() + 1, 0, 0, 0);
  return d;
}

export function getDeadline(g: ShortTermGoal) {
  switch (g.deadlineType) {
    case "HOURLY": return nextHourEnd();
    case "AT_TIME": return nextSpecificTime(g.deadlineTime ?? "21:00");
    case "DAILY_EOD": return endOfToday(USER_END_OF_DAY);
    case "WEEKLY_EOW": return endOfCurrentWeek();
    case "MONTHLY_EOM": return endOfCurrentMonth();
    default: return endOfToday(USER_END_OF_DAY);
  }
}

export function formatCountdown(deadline: Date) {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return { text: "OVERDUE", overdue: true };

  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 60) return { text: `in ${mins}m`, overdue: false };
  if (hrs < 24) return { text: `in ${hrs}h ${mins % 60}m`, overdue: false };
  if (days === 1) return { text: "tomorrow", overdue: false };
  if (days < 30) return { text: `in ${days}d`, overdue: false };

  return { text: `in ${Math.floor(days / 30)}mo`, overdue: false };
}

export function deadlineTypeLabel(g: ShortTermGoal) {
  switch (g.deadlineType) {
    case "HOURLY": return "Hourly";
    case "AT_TIME": return `At ${g.deadlineTime}`;
    case "DAILY_EOD": return "Today";
    case "WEEKLY_EOW": return "This week";
    case "MONTHLY_EOM": return "This month";
    default: return "";
  }
}
