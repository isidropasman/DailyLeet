import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::vector<int> solve(const std::vector<int>& intervals)";
const pairs = [
  "std::vector<std::pair<int, int>> pairs;",
  braces("for (std::size_t i = 0; i < intervals.size(); i += 2)", "pairs.emplace_back(intervals[i], intervals[i + 1]);"),
];
const overlaps = ["pairs[i].first <= merged.back()", "pairs[i].first < merged.back()", "pairs[i].first <= pairs[i - 1].second", "pairs[i].first <= merged.back() + 1"];

function extend(merge: number) {
  if (merge < 0) return pending("cómo fusionarlo con el último.");
  if (merge === 2) return braces("for (std::size_t j = first; j <= i; j++)", "merged.back() = std::max(merged.back(), pairs[j].second);");
  return merge === 0 ? "merged.back() = std::max(merged.back(), pairs[i].second);" : merge === 1 ? "merged.back() = pairs[i].second;" : "continue;";
}

function sweep(compare: number, merge: number) {
  return ["std::vector<int> merged;", merge === 2 && "std::size_t first = 0;",
    braces("for (std::size_t i = 0; i < pairs.size(); i++)",
      compare < 0 ? pending("cuándo el intervalo se pisa con el último y cómo fusionarlo.") : [
        braces(`if (!merged.empty() && ${overlaps[compare]})`, extend(merge)),
        braces("else", merge === 2 && "first = i;", "merged.push_back(pairs[i].first);", "merged.push_back(pairs[i].second);")]),
    "return merged;"];
}

export function cpp([approach, compare, merge]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [pairs, "bool changed = true;",
    braces("while (changed)", "changed = false;",
      braces("for (int i = 0; i < std::ssize(pairs); i++)",
        braces("for (int j = i + 1; j < std::ssize(pairs); j++)",
          braces("if (pairs[j].first <= pairs[i].second && pairs[i].first <= pairs[j].second)",
            "pairs[i] = {std::min(pairs[i].first, pairs[j].first), std::max(pairs[i].second, pairs[j].second)};",
            "pairs.erase(pairs.begin() + j);", "changed = true;", "j--;")))),
    "std::ranges::sort(pairs);",
    "std::vector<int> merged;",
    braces("for (const auto& [start, end] : pairs)", "merged.push_back(start);", "merged.push_back(end);"),
    "return merged;"] });
  if (approach === 2) return translationUnit({ signature, body: ["int last = -1;",
    braces("for (std::size_t i = 1; i < intervals.size(); i += 2)", "last = std::max(last, intervals[i]);"),
    "std::vector<bool> covered(last + 1, false);",
    braces("for (std::size_t i = 0; i < intervals.size(); i += 2)",
      braces("for (int t = intervals[i]; t <= intervals[i + 1]; t++)", "covered[t] = true;")),
    "std::vector<int> merged;",
    braces("for (int t = 0; t <= last; t++)",
      braces("if (covered[t] && (t == 0 || !covered[t - 1]))", "merged.push_back(t);"),
      braces("if (covered[t] && (t == last || !covered[t + 1]))", "merged.push_back(t);")),
    "return merged;"] });
  if (approach === 3) return translationUnit({ signature, body: [pairs, sweep(0, 0)] });
  return translationUnit({ signature, body: [pairs, "std::ranges::sort(pairs);", sweep(compare, merge)] });
}
