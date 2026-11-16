import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Correlativas", difficulty: "Difícil", topic: "Grafos",
  description: "Tenés n materias y pares [a, b]: para cursar a tenés que haber aprobado b. Devolvé un orden en el que se puedan cursar todas. Si las correlativas forman un ciclo, devolvé [].",
  example: "n = 4, [[1, 0], [2, 0], [3, 1], [3, 2]]", expected: "[0, 2, 1, 3]",
  explanation: "La 0 no tiene correlativas. Con la 0 aprobada se liberan la 1 y la 2, y con las dos se libera la 3. También vale [0, 1, 2, 3]: se acepta cualquier orden válido.",
  sample: { input: [1, 0, 2, 0, 3, 1, 3, 2], target: 4 },
  constraints: ["1 ≤ n ≤ 2000", "Los pares no se repiten", "Puede haber materias sueltas y autociclos ([a, a])", "Cualquier orden válido es aceptado"],
  steps: [
    { title: "Enfoque", question: "¿Cómo armás el orden?", options: [option("Sin pendientes primero", "Cola de materias sin correlativas pendientes (Kahn)."), option("DFS en post-orden", "Marcás visitado y agregás la materia al volver."), option("Pasadas sucesivas", "En cada pasada tomás lo que ya se puede cursar."), option("Ordenar por cantidad de correlativas", "Menos requisitos, antes.")] },
    { title: "Memoria", question: "¿Qué guardás de cada correlativa?", options: [option("Requisito → dependientes + contador", "adj[b].push(a) y degree[a]++."), option("Materia → requisitos", "adj[a].push(b) y degree[b]++."), option("Bandera «tiene pendientes»", "Un booleano en vez de un contador."), option("Un dependiente por materia", "Un Map requisito → siguiente materia.")] },
    { title: "Regla", question: "¿Cómo usás la cola?", options: [option("Si no salieron todas, hay ciclo", "Arrancás con todas las libres; si order.length < n, devolvés []."), option("Devolver lo que salió", "El orden parcial alcanza."), option("Arrancar por la materia 0", "Es la primera de la lista."), option("Encolar al liberar un requisito", "No hace falta esperar a que quede en cero.")] },
  ],
  lesson: "Una materia se puede cursar cuando no le queda ninguna correlativa pendiente. Kahn cuenta las pendientes de cada materia, encola las que están en cero y, al sacar una, descuenta a sus dependientes. Si hay un ciclo, sus materias nunca llegan a cero: por eso alcanza con chequear si salieron las n. Es O(V + E).",
  resource: { title: "Problema original: Course Schedule II", url: "https://leetcode.com/problems/course-schedule-ii/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
