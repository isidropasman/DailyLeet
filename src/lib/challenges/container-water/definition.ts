import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Entre dos paredes", difficulty: "Medio", topic: "Dos punteros",
  description: "Cada número es la altura de una pared y dos paredes vecinas están a distancia 1. Elegí dos paredes: el agua entre ellas llega hasta la más baja. Devolvé la mayor cantidad de agua que podés guardar (altura de la más baja × distancia).",
  example: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", expected: "49",
  explanation: "Las paredes de altura 8 (posición 1) y 7 (posición 8) están a distancia 7. El agua llega hasta 7: guardan 7 × 7 = 49.",
  sample: { input: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
  constraints: ["2 ≤ height.length ≤ 10⁵", "0 ≤ height[i] ≤ 10⁴", "Las paredes no tienen ancho: entre i y j hay j − i de distancia", "Objetivo: O(n)"],
  steps: [
    { title: "Enfoque", question: "¿Cómo elegís las dos paredes?", options: [option("Dos punteros", "Arrancar en los extremos e ir cerrando."), option("Todos los pares", "Probar cada par de paredes."), option("Las dos más altas", "Quedarte con las paredes más altas."), option("Anclar la más alta", "Fijar la más alta y buscarle pareja.")] },
    { title: "Memoria", question: "¿Qué pared descartás en cada paso?", options: [option("La más baja", "Avanza el puntero de la pared más baja."), option("La más alta", "Avanza el puntero de la pared más alta."), option("Las dos", "Los dos punteros avanzan a la vez."), option("Alternar", "Una vez la izquierda, otra la derecha.")] },
    { title: "Regla", question: "¿Cuánta agua guardan las dos paredes?", options: [option("Más baja × distancia", "min(alto) · (r − l)."), option("Más alta × distancia", "max(alto) · (r − l)."), option("Más baja × paredes", "min(alto) · (r − l + 1)."), option("Izquierda × distancia", "height[l] · (r − l).")] },
  ],
  lesson: "El agua entre l y r es la pared más baja por la distancia. Arrancando en los extremos, la pared más baja ya dio su mejor par: con cualquier otra pared adentro la distancia baja y la altura no sube. Descartarla es seguro, así que con dos punteros revisás n − 1 pares en vez de n²/2.",
  resource: { title: "Problema original: Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
