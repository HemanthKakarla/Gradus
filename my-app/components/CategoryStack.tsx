"use client";

import { useState, useRef, useEffect } from "react";
import { useSprings, animated as a, to } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

import {
  ShortTermGoal,
  formatCountdown,
  getDeadline,
  deadlineTypeLabel,
  categoryColors
} from "./goalData";

const UNDO_DURATION = 3000;
const SWIPE_DURATION = 450;

export default function CategoryStack({ goals, title }: { goals: ShortTermGoal[]; title: string; }) {

  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick(v => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [cards, setCards] = useState<ShortTermGoal[]>(
    () => [...goals].sort((a, b) => getDeadline(a).getTime() - getDeadline(b).getTime())
  );

  const [lastRemoved, setLastRemoved] = useState<ShortTermGoal | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const [springs, api] = useSprings(cards.length, i => ({
    x: 0,
    y: i * -6,
    scale: 1 - i * 0.02,
    rot: 0,
  }));

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

  const undo = () => {
    if (!lastRemoved) return;

    setCards(prev =>
      [...prev, lastRemoved].sort((a, b) => getDeadline(a).getTime() - getDeadline(b).getTime())
    );

    setLastRemoved(null);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
  };

  return (
    <section className="category-section">
      <h2 className="category-title">{title}</h2>

      {cards.length === 0 && (
        <p className="empty-text">All done 🎉</p>
      )}

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
                  borderColor: overdue ? "#ff5e5e" : "white",
                  transform: to(
                    [rot, scale],
                    (r, s) => `perspective(1500px) rotate(${r}deg) scale(${s})`
                  ),
                }}
              >
                <div
                  className="category-pill"
                  style={{ background: categoryColors[cards[i].category] }}
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
                  <button className="btn-no" onClick={() => completeSwipe(i, -1)}>✖</button>
                  <button className="btn-yes" onClick={() => completeSwipe(i, 1)}>✔</button>
                </div>
              </a.div>
            </a.div>
          );
        })}
      </div>

      {lastRemoved && (
        <button className="undo-btn" onClick={undo}>
          Undo
        </button>
      )}
    </section>
  );
}
