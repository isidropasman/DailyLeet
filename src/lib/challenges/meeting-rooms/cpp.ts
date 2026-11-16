import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& meetings)";
const n = "const int n = static_cast<int>(meetings.size());";
const pairs = [
  "std::vector<std::pair<int, int>> sorted;",
  braces("for (int i = 0; i < n; i += 2)", "sorted.emplace_back(meetings[i], meetings[i + 1]);"),
  "std::ranges::sort(sorted);",
];
const empty = ["if (meetings.empty()) {", "    return 0;", "}"];
const order = [
  "std::ranges::stable_sort(events);",
  "std::ranges::stable_sort(events, [](const auto& a, const auto& b) { return a.first != b.first ? a.first < b.first : a.second > b.second; });",
  "std::ranges::stable_sort(events);",
  "std::ranges::stable_sort(events, [](const auto& a, const auto& b) { return a.first < b.first; });",
];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [n, "int best = 0;",
    braces("for (int i = 0; i < n; i += 2)", "int active = 0;",
      braces("for (int j = 0; j < n; j += 2)", braces("if (meetings[j] <= meetings[i] && meetings[i] < meetings[j + 1])", "active++;")),
      "best = std::max(best, active);"),
    "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [empty, n, pairs, "int best = 1;", "int run = 1;",
    braces("for (std::size_t i = 1; i < sorted.size(); i++)", "run = sorted[i].first < sorted[i - 1].second ? run + 1 : 1;", "best = std::max(best, run);"),
    "return best;"] });
  if (approach === 3) return translationUnit({ signature, body: [empty, n, pairs, "int groups = 1;", "int end = sorted[0].second;",
    braces("for (std::size_t i = 1; i < sorted.size(); i++)",
      "if (sorted[i].first < end) {", "    end = std::max(end, sorted[i].second);", "} else {", "    groups++;", "    end = sorted[i].second;", "}"),
    "return groups;"] });
  if (memory < 0) return translationUnit({ signature, body: [pending("qué guardar de las reuniones."), unfinished("cómo encontrar el momento más ocupado.")] });
  const tie = rule < 0 && pending("cómo desempatar dos eventos en el mismo minuto.");
  if (memory === 1) return translationUnit({ signature, body: [empty, n, pairs, tie, "int rooms = 1;", "int last = sorted[0].second;",
    braces("for (std::size_t i = 1; i < sorted.size(); i++)", braces("if (sorted[i].first < last)", "rooms++;"), "last = sorted[i].second;"),
    "return rooms;"] });
  if (memory === 2) return translationUnit({ signature, body: [n, "int last = 0;",
    braces("for (int i = 1; i < n; i += 2)", "last = std::max(last, meetings[i]);"),
    "std::vector<int> diff(last + 1, 0);",
    braces("for (int i = 0; i < n; i += 2)", "diff[meetings[i]]++;", "diff[meetings[i + 1]]--;"),
    tie, "int rooms = 0;", "int best = 0;",
    braces("for (int delta : diff)", "rooms += delta;", "best = std::max(best, rooms);"),
    "return best;"] });
  return translationUnit({ signature, body: [n, "std::vector<std::pair<int, int>> events;",
    braces("for (int i = 0; i < n; i += 2)", "events.emplace_back(meetings[i], 1);", `events.emplace_back(meetings[i + 1]${memory === 3 ? " + 1" : ""}, -1);`),
    rule < 0 ? [pending("cómo ordenar los eventos y qué devolver."), unfinished("cómo ordenar los eventos y qué devolver.")] : [
      order[rule], "int rooms = 0;", "int best = 0;",
      braces("for (const auto& event : events)", "rooms += event.second;", "best = std::max(best, rooms);"),
      `return ${rule === 2 ? "rooms" : "best"};`]] });
}
