import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Lo justo y necesario", difficulty: "Medio", topic: "Strings",
  description: "Devolvé el fragmento más corto de s que contenga todas las letras de t, contando repeticiones: si t tiene dos «a», el fragmento necesita dos «a». Si no existe, devolvé \"\". Si hay varios del mismo largo, vale cualquiera.",
  example: 's = "ADOBECODEBANC", t = "ABC"', expected: '"BANC"',
  explanation: '"BANC" tiene una A, una B y una C, y ningún fragmento de 3 letras las tiene a las tres. "ADOBEC" también las cubre, pero es más largo.',
  sample: { input: "ADOBECODEBANC", other: "ABC" },
  constraints: ["1 ≤ s.length, t.length ≤ 100.000", "Letras ASCII, distingue mayúsculas", "Se acepta cualquier fragmento de largo mínimo"],
  steps: [
    { title: "Enfoque", question: "¿Cómo recorrés los fragmentos de s?", options: [option("Expandir y encoger", "La derecha suma letras, la izquierda recorta."), option("Cada comienzo", "Desde cada posición, crecer hasta cubrir t."), option("Ventana fija", "Probar fragmentos del largo de t."), option("Primeras apariciones", "De la primera letra útil a la última.")] },
    { title: "Memoria", question: "¿Qué guardás de t?", options: [option("Faltantes por letra + contador", "need[c] y cuántas letras faltan en total."), option("Conjunto de letras de t", "Alcanza con saber cuáles faltan."), option("Comparar mapas completos", "Revisar que la ventana cubra t en cada paso."), option("Contador sin tope", "Cada letra de t que entra descuenta una faltante.")] },
    { title: "Regla", question: "¿Qué hacés cuando la ventana cubre t?", options: [option("Encoger mientras sea válida", "Registrar y recortar por la izquierda."), option("Encoger una vez", "Un paso de izquierda por paso de derecha."), option("Registrar al romperse", "Guardar la ventana apenas deja de cubrir."), option("Reiniciar al cubrir", "Empezar de nuevo después de cada hallazgo.")] },
  ],
  lesson: "La ventana crece por la derecha hasta cubrir t y después se encoge por la izquierda mientras siga cubriendo: cada ventana válida que registrás es la más corta que termina en esa posición. need[c] cuenta cuántas c faltan (negativo si sobran) y missing cuántas letras faltan en total: solo descontás cuando la letra todavía hacía falta. Cada puntero avanza n veces: O(|s| + |t|).",
  resource: { title: "Problema original: Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
