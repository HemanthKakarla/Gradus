import {
  initialGoals,
  categories,
} from "../../components/goalData";

import CategoryStack from "../../components/CategoryStack";

export default function Checkin() {
  return (
    <main className="scroll">
      {categories.map(cat => (
        <CategoryStack
          key={cat}
          title={cat}
          goals={initialGoals.filter(g => g.category === cat)}
        />
      ))}
    </main>
  );
}
