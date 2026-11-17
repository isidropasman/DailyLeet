import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int[] solve(int[] intervals)";
const pairs = [
  "int[][] pairs = new int[intervals.length / 2][];",
  braces("for (int i = 0; i < intervals.length; i += 2)", "pairs[i / 2] = new int[] {intervals[i], intervals[i + 1]};"),
];
const sort = "Arrays.sort(pairs, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));";
const overlaps = ["pairs[i][0] <= merged[end]", "pairs[i][0] < merged[end]", "pairs[i][0] <= pairs[i - 1][1]", "pairs[i][0] <= merged[end] + 1"];

function extend(merge: number) {
  if (merge < 0) return pending("cómo fusionarlo con el último.");
  if (merge === 2) return braces("for (int j = first; j <= i; j++)", "merged[end] = Math.max(merged[end], pairs[j][1]);");
  return merge === 0 ? "merged[end] = Math.max(merged[end], pairs[i][1]);" : merge === 1 ? "merged[end] = pairs[i][1];" : "continue;";
}

function sweep(compare: number, merge: number) {
  return ["int[] merged = new int[intervals.length];", "int size = 0;", merge === 2 && "int first = 0;",
    braces("for (int i = 0; i < pairs.length; i++)",
      compare < 0 ? pending("cuándo el intervalo se pisa con el último y cómo fusionarlo.") : [
        "int end = size - 1;",
        braces(`if (size > 0 && ${overlaps[compare]})`, extend(merge)),
        braces("else", merge === 2 && "first = i;", "merged[size++] = pairs[i][0];", "merged[size++] = pairs[i][1];")]),
    "return Arrays.copyOf(merged, size);"];
}

export function java([approach, compare, merge]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["List<int[]> pairs = new ArrayList<>();",
    braces("for (int i = 0; i < intervals.length; i += 2)", "pairs.add(new int[] {intervals[i], intervals[i + 1]});"),
    "boolean changed = true;",
    braces("while (changed)", "changed = false;",
      braces("for (int i = 0; i < pairs.size(); i++)",
        braces("for (int j = i + 1; j < pairs.size(); j++)",
          "int[] a = pairs.get(i);", "int[] b = pairs.get(j);",
          braces("if (b[0] <= a[1] && a[0] <= b[1])",
            "pairs.set(i, new int[] {Math.min(a[0], b[0]), Math.max(a[1], b[1])});",
            "pairs.remove(j);", "changed = true;", "j--;")))),
    "pairs.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));",
    "int[] merged = new int[pairs.size() * 2];",
    braces("for (int i = 0; i < pairs.size(); i++)", "merged[2 * i] = pairs.get(i)[0];", "merged[2 * i + 1] = pairs.get(i)[1];"),
    "return merged;"] });
  if (approach === 2) return javaClass(signature, { body: ["int last = -1;",
    braces("for (int i = 1; i < intervals.length; i += 2)", "last = Math.max(last, intervals[i]);"),
    "boolean[] covered = new boolean[last + 1];",
    braces("for (int i = 0; i < intervals.length; i += 2)",
      braces("for (int t = intervals[i]; t <= intervals[i + 1]; t++)", "covered[t] = true;")),
    "int[] merged = new int[intervals.length];", "int size = 0;",
    braces("for (int t = 0; t <= last; t++)",
      braces("if (covered[t] && (t == 0 || !covered[t - 1]))", "merged[size++] = t;"),
      braces("if (covered[t] && (t == last || !covered[t + 1]))", "merged[size++] = t;")),
    "return Arrays.copyOf(merged, size);"] });
  if (approach === 3) return javaClass(signature, { body: [pairs, sweep(0, 0)] });
  return javaClass(signature, { body: [pairs, sort, sweep(compare, merge)] });
}
