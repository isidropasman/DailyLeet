import { isModuleKind, PLAN_START, scheduleFor, type Kind } from "./challenges";

const DAY_MS = 86_400_000;

function issuedBefore(kind: Kind, today: string): boolean {
  const end = Date.parse(today);
  for (let time = Date.parse(PLAN_START); time < end; time += DAY_MS) {
    if (scheduleFor(new Date(time).toISOString().slice(0, 10)).kind === kind) return true;
  }
  return false;
}

// Practice evaluates all 12 hidden cases, so it is an answer oracle: a kind may only be
// practiced once nobody can still play it ranked (or the player already submitted it today).
export function practiceUnlocked(kind: Kind, today: string, submittedToday: boolean): boolean {
  if (scheduleFor(today).kind === kind) return submittedToday;
  if (!isModuleKind(kind)) return true;
  return issuedBefore(kind, today);
}
