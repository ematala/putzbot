import { roomies, trash } from "./data";
import { closestTo, format } from "date-fns";

const trashMap: Record<number, string> = {
  0: "🟦 Papiertonne",
  1: "⬛️ Restabfalltonne",
  2: "🟫 Biotonne",
  3: "🟨 Wertstofftonne",
  4: "🟧 Sperrgut, Grünabfall",
};

const parseDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getTrash = () => {
  const dates = Object.keys(trash)
    .map(parseDate)
    .filter((d) => d > new Date());
  const closest = closestTo(new Date(), dates);
  if (!closest) return [];
  const date = format(closest, "yyyy-MM-dd");
  return trash[date].map((t) => trashMap[t]);
};

export const check = (id: number) => roomies.map((r) => r.id).includes(id);
