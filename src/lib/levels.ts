export const XP_PER_LEVEL = 100;

const RANKS: { minLevel: number; title: string }[] = [
  { minLevel: 20, title: "Мастер" },
  { minLevel: 15, title: "Знаток" },
  { minLevel: 10, title: "Продвинутый" },
  { minLevel: 5, title: "Ученик" },
  { minLevel: 1, title: "Новичок" },
];

export function getRank(level: number): string {
  return RANKS.find((r) => level >= r.minLevel)!.title;
}
