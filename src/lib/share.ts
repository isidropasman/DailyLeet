export function shareMessage({ score, day, title, url, practice, testing = false }: { score: number; day: string; title: string; url: string; practice: boolean; testing?: boolean }): string {
  const [year, month, date] = day.split("-");
  return `DailyLeet · ${date}/${month}/${year}${testing ? " · Prueba privada" : practice ? " · Práctica" : ""}\nMi puntaje: ${score}/100\nDesafío: ${title}\n${url}/`;
}
