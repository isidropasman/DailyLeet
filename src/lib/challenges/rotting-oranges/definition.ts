import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Moho en el cajón", difficulty: "Medio", topic: "Grafos (BFS)",
  description: "Un cajón de fruta es una grilla: 0 es un hueco, 1 una fruta sana y 2 una con moho. Cada minuto, el moho pasa a las frutas sanas de arriba, abajo, izquierda y derecha. Devolvé cuántos minutos pasan hasta que no queda ninguna sana, o −1 si alguna nunca se contagia.",
  example: "[[2, 1, 0], [1, 1, 1], [0, 1, 1]]", expected: "4",
  explanation: "Minuto 1: el moho pasa a las dos vecinas de la esquina. Minuto 2: al centro. Minuto 3: a la derecha y abajo del centro. Minuto 4: a la esquina opuesta, la última sana.",
  sample: { input: [2, 1, 0, 1, 1, 1, 0, 1, 1], target: 3 },
  constraints: ["1 ≤ filas, columnas ≤ 10", "grid[i] ∈ {0, 1, 2}", "La grilla llega aplanada por filas: la celda (r, c) es grid[r · cols + c]"],
  steps: [
    { title: "Enfoque", question: "¿Cómo simulás el contagio?", options: [option("BFS desde todas a la vez", "Todas las del moho arrancan en la cola; cada nivel es un minuto."), option("Simular minuto a minuto", "Cada minuto recorrés la grilla entera y contagiás."), option("Un BFS por cada fruta con moho", "Te quedás con el que más tarda."), option("DFS con una pila", "Cada vecina sana queda a un minuto más.")] },
    { title: "Memoria", question: "¿Cuáles son las vecinas de la celda i?", options: [option("Las 4 direcciones con bordes", "Fila y columna dentro de la grilla."), option("Las 8 direcciones", "También las diagonales."), option("Derecha y abajo", "Recorriendo en orden, alcanza."), option("i ± 1 e i ± cols", "Solo chequeás que el índice exista.")] },
    { title: "Regla", question: "¿Cuándo cortás y qué devolvés?", options: [option("Cortar sin sanas; −1 si quedan", "Un minuto por nivel de la cola."), option("Devolver los minutos", "Sin mirar si quedaron sanas."), option("Vaciar la cola", "Un minuto por cada nivel, hasta el último."), option("Sin moho, −1 directo", "Si nada arranca podrido, nada se contagia.")] },
  ],
  lesson: "Todas las frutas con moho contagian a la vez, así que el minuto en que cae cada sana es su distancia a la fuente más cercana. Un BFS que arranca con todas las fuentes en la cola calcula esas distancias en O(m · n): cada nivel es un minuto. Si al final queda alguna sana, nunca la alcanzó nadie: −1.",
  resource: { title: "Problema original: Rotting Oranges", url: "https://leetcode.com/problems/rotting-oranges/" },
};

export const activeSteps = (approach: number) => (approach === 0 ? [0, 1, 2] : [0, 1]);
