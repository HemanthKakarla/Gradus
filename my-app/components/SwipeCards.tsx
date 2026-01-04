"use client";

import { useState, useRef, useEffect } from "react";
import { useSprings, animated as a, to } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

/* TYPES */

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

/* SETTINGS */

const USER_END_OF_DAY = "23:00";
const UNDO_DURATION = 3000;
const SWIPE_DURATION = 450;

/* CATEGORY COLORS */

const categoryColors: Record<string, string> = {
  "Career & Skills": "#4DA3FF",
  "Hobbies": "#B57BFF",
  "Health & Fitness": "#6BFF6B",
  "Relationships & Social": "#FF7BAA",
  default: "#AAAAAA",
};

/* GOALS */

const initialGoals: ShortTermGoal[] = [
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

/* DEADLINE HELPERS */

function parseHM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return { h, m };
}

function endOfToday(eod: string) {
  const now = new Date();
  const { h, m } = parseHM(eod);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

function nextSpecificTime(hhmm: string) {
  const now = new Date();
  const { h, m } = parseHM(hhmm);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

function endOfCurrentWeek() {
  const now = new Date();
  const d = new Date(now);
  const diff = 6 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfCurrentMonth() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function nextHourEnd() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(now.getHours() + 1, 0, 0, 0);
  return d;
}

function getDeadline(g: ShortTermGoal) {
  switch (g.deadlineType) {
    case "HOURLY": return nextHourEnd();
    case "AT_TIME": return nextSpecificTime(g.deadlineTime ?? "21:00");
    case "DAILY_EOD": return endOfToday(USER_END_OF_DAY);
    case "WEEKLY_EOW": return endOfCurrentWeek();
    case "MONTHLY_EOM": return endOfCurrentMonth();
    default: return endOfToday(USER_END_OF_DAY);
  }
}

/* COUNTDOWN FORMATTER */

function formatCountdown(deadline: Date) {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return { text: "OVERDUE", overdue: true };

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return { text: `in ${diffMins}m`, overdue: false };
  if (diffHours < 24) return { text: `in ${diffHours}h ${diffMins % 60}m`, overdue: false };
  if (diffDays === 1) return { text: "tomorrow", overdue: false };
  if (diffDays < 30) return { text: `in ${diffDays}d`, overdue: false };

  const months = Math.floor(diffDays / 30);
  return { text: `in ${months}mo`, overdue: false };
}

function deadlineTypeLabel(g: ShortTermGoal) {
  switch (g.deadlineType) {
    case "HOURLY": return "Hourly";
    case "AT_TIME": return `At ${g.deadlineTime}`;
    case "DAILY_EOD": return "Today";
    case "WEEKLY_EOW": return "This week";
    case "MONTHLY_EOM": return "This month";
    default: return "";
  }
}

/* COMPONENT */

export default function SwipeCards() {
  /* re-render timers every minute */
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick(v => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [cards, setCards] = useState<ShortTermGoal[]>(
    () => [...initialGoals].sort((a, b) => getDeadline(a).getTime() - getDeadline(b).getTime())
  );

  const [lastRemoved, setLastRemoved] = useState<ShortTermGoal | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const [springs, api] = useSprings(cards.length, i => ({
    x: 0,
    y: i * -6,
    scale: 1 - i * 0.02,
    rot: 0,
  }));

  /* SWIPE ANIMATION */

  const animateSwipe = (index: number, dir: 1 | -1) => {
    api.start(i => {
      if (i !== index) return;
      return {
        x: (window.innerWidth + 200) * dir,
        rot: dir * 10,
        scale: 1,
        config: { duration: SWIPE_DURATION },
      };
    });
  };

  const removeAfterAnimation = (index: number) => {
    const removed = cards[index];
    setLastRemoved(removed);

    setTimeout(() => {
      setCards(prev =>
        prev
          .filter((_, i) => i !== index)
          .sort((a, b) => getDeadline(a).getTime() - getDeadline(b).getTime())
      );
    }, SWIPE_DURATION);

    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => setLastRemoved(null), UNDO_DURATION);
  };

  const completeSwipe = (index: number, dir: 1 | -1) => {
    animateSwipe(index, dir);
    removeAfterAnimation(index);
  };

  /* DRAG */

  const bind = useDrag(
    ({ args: [index], active, movement: [mx], direction: [dx], velocity }) => {
      const trigger = velocity > 0.2;
      const dir = dx > 0 ? 1 : -1;

      if (!active && trigger) {
        completeSwipe(index, dir);
        return;
      }

      api.start(i => {
        if (i !== index) return;
        return {
          x: active ? mx : 0,
          rot: active ? mx / 100 : 0,
          scale: active ? 1.05 : 1,
        };
      });
    }
  );

  /* UNDO */

  const undo = () => {
    if (!lastRemoved) return;

    setCards(prev =>
      [...prev, lastRemoved].sort((a, b) => getDeadline(a).getTime() - getDeadline(b).getTime())
    );

    setLastRemoved(null);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
  };

  if (cards.length === 0)
    return <p style={{ color: "white" }}>All tasks done 🎉</p>;

  return (
    <>
      <div className="cards-container">
        {springs.map(({ x, y, rot, scale }, i) => {
          const deadline = getDeadline(cards[i]);
          const { text, overdue } = formatCountdown(deadline);

          return (
            <a.div
              key={cards[i].id}
              className="card-wrapper"
              style={{ transform: to([x, y], (x, y) => `translate3d(${x}px,${y}px,0)`) }}
            >
              <a.div
                {...bind(i)}
                className="card"
                style={{
                  transform: to(
                    [rot, scale],
                    (r, s) => `perspective(1500px) rotate(${r}deg) scale(${s})`
                  ),
                }}
              >
                <div
                  className="category-pill"
                  style={{
                    background: categoryColors[cards[i].category] ?? categoryColors.default,
                  }}
                >
                  {cards[i].category}
                </div>

                <h1 className="card-title">{cards[i].title}</h1>

                <p className="deadline-meta">
                  {deadlineTypeLabel(cards[i])} •{" "}
                  <span className={overdue ? "deadline-overdue" : ""}>
                    {text}
                  </span>
                </p>

                <div className="card-buttons">
                  <button
                    className="btn-no"
                    onClick={e => {
                      e.stopPropagation();
                      completeSwipe(i, -1);
                    }}
                  >
                    ✖
                  </button>

                  <button
                    className="btn-yes"
                    onClick={e => {
                      e.stopPropagation();
                      completeSwipe(i, 1);
                    }}
                  >
                    ✔
                  </button>
                </div>
              </a.div>
            </a.div>
          );
        })}
      </div>

      {lastRemoved && (
        <button className="undo-btn" onClick={undo}>
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path d="M12 5v4H5V5l-5 5 5 5v-4h7V5z" fill="white" />
          </svg>

          <svg className="undo-ring" width="60" height="60">
            <circle cx="30" cy="30" r="26" />
          </svg>
        </button>
      )}
    </>
  );
}
