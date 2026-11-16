import type { Challenge, LegacyKind } from "./challenges";

const option = (title: string, detail: string) => ({ title, detail });

export const additionalChallenges: (Challenge & { kind: LegacyKind })[] = [
  {
    kind: "stock", title: "El mejor momento", difficulty: "Fácil", topic: "Arrays",
    description: "Tenés el precio de una acción por día. Encontrá la mayor ganancia posible comprando una vez y vendiendo en un día posterior. Si no conviene operar, devolvé 0.",
    example: "[7, 1, 5, 3, 6, 4]", expected: "5", explanation: "Comprar a 1 y vender después a 6 da una ganancia de 5.",
    sample: { input: [7,1,5,3,6,4] },
    constraints: ["0 ≤ prices.length ≤ 10.000", "Precios enteros entre 0 y 10.000", "La compra siempre precede a la venta"],
    steps: [
      { title: "Enfoque", question: "¿Cómo vas a buscar la ganancia?", options: [option("Un recorrido cronológico", "Evaluar cada día conservando información anterior."), option("Todas las compras y ventas", "Probar cada compra con todas las ventas posteriores."), option("Ordenar los precios", "Restar el menor precio al mayor, después de ordenar."), option("Solo días consecutivos", "Buscar la mejor diferencia entre un día y el siguiente.")] },
      { title: "Memoria", question: "¿Qué precio de compra conservás?", options: [option("El mínimo hasta ahora", "Conservar el precio más bajo de los días anteriores."), option("El máximo hasta ahora", "Conservar el precio más alto de los días anteriores."), option("El día anterior", "Reemplazar la compra por el precio de cada día."), option("El primer día", "Mantener siempre el precio inicial.")] },
      { title: "Regla", question: "¿Cómo actualizás la mejor ganancia?", options: [option("Conservar el máximo", "Comparar la ganancia actual con la mejor anterior y con 0."), option("Quedarte con la última", "Reemplazar el resultado por la ganancia de hoy."), option("Tomar valor absoluto", "Contar también las diferencias negativas como ganancia."), option("Conservar el mínimo", "Quedarte con la menor diferencia observada.")] },
    ],
    lesson: "Al evaluar una venta, el mínimo guardado representa una compra posible en el pasado. El máximo de las ganancias nunca debe perderse al llegar un día peor. Probar todos los pares también funciona, pero cuesta O(n²) en lugar de O(n).",
    resource: { title: "Problema original: Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  },
  {
    kind: "move-zeroes", title: "Ceros al final", difficulty: "Medio", topic: "Two pointers",
    description: "Mové todos los ceros al final del array sin alterar el orden de los demás números. Modificá el mismo array, sin crear otro para guardar el resultado, y devolvelo.",
    example: "[0, 1, 0, 3, 12]", expected: "[1, 3, 12, 0, 0]", explanation: "Los valores 1, 3 y 12 conservan su orden; los dos ceros quedan al final.",
    sample: { input: [0,1,0,3,12] },
    constraints: ["0 ≤ nums.length ≤ 10.000", "Puede haber negativos y ceros repetidos", "Usá O(1) de espacio auxiliar y devolvé el array original"],
    steps: [
      { title: "Enfoque", question: "¿Cómo reorganizás los valores?", options: [option("Compactar y rellenar", "Escribir los valores elegidos al principio y rellenar con ceros."), option("Intercambiar posiciones", "Intercambiar cada valor elegido con la posición de escritura."), option("Filtrar a otro array", "Crear un array sin ceros y agregar los ceros al final."), option("Ordenar numéricamente", "Ordenar todos los números de menor a mayor.")] },
      { title: "Memoria", question: "¿Dónde empieza la posición de escritura?", options: [option("En cero, conservando el avance", "La primera posición libre avanza durante el recorrido."), option("En la posición uno", "Reservar el primer lugar y empezar después."), option("En la última posición", "Empezar a escribir desde el final del array."), option("En cero en cada vuelta", "Reiniciar la escritura al procesar cada número.")] },
      { title: "Regla", question: "¿Cuándo elegís un valor y avanzás la escritura?", options: [option("Solo cuando no es cero", "Conservar negativos y positivos; omitir los ceros."), option("Avanzar en cada vuelta", "Mover la escritura aunque el número sea cero."), option("Cuando es mayor o igual a cero", "Conservar ceros y positivos; omitir los negativos."), option("Omitir el último elemento", "Aplicar la regla de no ceros hasta el penúltimo lugar.")] },
    ],
    lesson: "El puntero de lectura inspecciona cada elemento y el de escritura marca la primera posición libre. Solo avanza al conservar un valor. Compactar y rellenar, o intercambiar, permiten conservar el orden con O(n) de tiempo y O(1) de espacio auxiliar. Filtrar a otro array incumple el contrato aunque sus valores se vean correctos.",
    resource: { title: "Problema original: Move Zeroes", url: "https://leetcode.com/problems/move-zeroes/" },
  },
  {
    kind: "anagram", title: "Las mismas letras", difficulty: "Fácil", topic: "Frecuencias",
    description: "Decidí si dos palabras contienen exactamente las mismas letras con la misma cantidad de apariciones. El orden puede cambiar, pero no puede sobrar ni faltar ninguna letra.",
    example: 's = "anagram", t = "nagaram"', expected: "true", explanation: "Las dos palabras tienen las mismas frecuencias: tres a, una n, una g, una r y una m.",
    sample: { input: "anagram", other: "nagaram" },
    constraints: ["0 ≤ s.length, t.length ≤ 10.000", "Solo letras minúsculas de a–z", "La cadena vacía es anagrama de sí misma"],
    steps: [
      { title: "Enfoque", question: "¿Cómo comparás las dos palabras?", options: [option("Contar y descontar", "Registrar letras de la primera y consumirlas con la segunda."), option("Ordenar ambas palabras", "Comparar las letras después de ordenarlas."), option("Comparar Sets", "Comparar los tipos de letras, sin contar repeticiones."), option("Sumar códigos de caracteres", "Comparar la longitud y la suma de códigos de cada palabra.")] },
      { title: "Memoria", question: "¿Cómo representás las apariciones?", options: [option("Un Map de frecuencias", "Un contador por letra."), option("Un array de 26 contadores", "Una posición por letra, a partir de a."), option("Un Set de letras pendientes", "Guardar cada letra una sola vez y eliminarla al encontrarla."), option("Un único contador", "Sumar todas las letras en el mismo contador.")] },
      { title: "Regla", question: "¿Cómo consumís las letras de la segunda palabra?", options: [option("Restar y exigir ceros", "Verificar la longitud, descontar y terminar sin pendientes."), option("Sumar nuevamente", "Incrementar los contadores también con la segunda palabra."), option("Verificar solo presencia", "Aceptar si cada letra aparece en el registro."), option("Permitir letras sobrantes", "No comprobar longitudes y aceptar contadores no negativos.")] },
    ],
    lesson: "Una letra que aparece dos veces exige dos apariciones en la otra palabra. Un Map o un array de 26 contadores modelan esa multiplicidad. Ordenar también es correcto, con O(n log n) de tiempo. Ni un Set ni la suma de códigos garantizan frecuencias iguales.",
    resource: { title: "Problema original: Valid Anagram", url: "https://leetcode.com/problems/valid-anagram/" },
  },
];
