export function shareMessage({ score, day, title, url, practice, testing = false, cases = [] }: { score: number; day: string; title: string; url: string; practice: boolean; testing?: boolean; cases?: boolean[] }): string {
  const [year, month, date] = day.split("-");
  const grid = cases.length > 0 ? `\n${cases.map(passed => passed ? "🟩" : "🟥").join("")} ${cases.filter(Boolean).length}/${cases.length} casos` : "";
  return `DailyLeet · ${date}/${month}/${year}${testing ? " · Prueba privada" : practice ? " · Práctica" : ""}\nMi puntaje: ${score}/100${grid}\nDesafío: ${title}\n${url}/`;
}
