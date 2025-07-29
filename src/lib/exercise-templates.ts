import { ExerciseType, Subject, Difficulty } from './ai-tutor-service'

export interface ExerciseTemplate {
  type: ExerciseType
  templates: {
    title: string
    description: string
    questionPatterns: string[]
    answerPatterns?: string[]
    tags: string[]
    hints?: string[]
  }[]
}

// Expanded exercise templates with more variety and complexity
export const exerciseTemplates: Record<Subject, Record<Difficulty, ExerciseTemplate[]>> = {
  [Subject.MATHEMATICS]: {
    [Difficulty.BEGINNER]: [
      {
        type: ExerciseType.BASIC_CONCEPTS,
        templates: [
          {
            title: "Operaciones Básicas",
            description: "Practica sumas, restas y multiplicaciones fundamentales",
            questionPatterns: [
              "¿Cuál es el resultado de {a} + {b}?",
              "Si tienes {a} manzanas y comes {b}, ¿cuántas te quedan?",
              "Calcula: {a} × {b}",
              "¿Cuánto es {a} - {b}?",
              "Un niño tiene {a} caramelos y le dan {b} más. ¿Cuántos tiene en total?"
            ],
            tags: ["suma", "resta", "multiplicación", "aritmética"],
            hints: [
              "Cuenta despacio y con cuidado",
              "Puedes usar objetos para ayudarte a contar",
              "Verifica tu respuesta haciendo la operación inversa"
            ]
          },
          {
            title: "Fracciones Simples",
            description: "Comprende el concepto básico de fracciones",
            questionPatterns: [
              "Si divides una pizza en {a} partes iguales y comes {b} partes, ¿qué fracción comiste?",
              "¿Cuál es mayor: 1/{a} o 1/{b}?",
              "Dibuja una figura que represente la fracción {a}/{b}"
            ],
            tags: ["fracciones", "división", "conceptos"],
            hints: [
              "Una fracción representa partes de un todo",
              "El número de abajo indica en cuántas partes se divide",
              "El número de arriba indica cuántas partes tomamos"
            ]
          }
        ]
      },
      {
        type: ExerciseType.PROBLEM_SOLVING,
        templates: [
          {
            title: "Problemas de la Vida Real",
            description: "Resuelve problemas matemáticos aplicados al día a día",
            questionPatterns: [
              "En una tienda, un producto cuesta ${a}. Si pagas con ${b}, ¿cuánto cambio recibes?",
              "Un autobús viaja {a} km en {b} horas. ¿Cuál es su velocidad promedio?",
              "María tiene {a} años y su hermana tiene {b} años más. ¿Cuántos años tiene su hermana?",
              "En un cine hay {a} filas con {b} asientos cada una. ¿Cuántos asientos hay en total?"
            ],
            tags: ["aplicación", "vida real", "problemas", "dinero", "tiempo"],
            hints: [
              "Identifica qué operación necesitas hacer",
              "Lee el problema dos veces antes de resolver",
              "Piensa en situaciones similares que hayas vivido"
            ]
          }
        ]
      }
    ],
    [Difficulty.INTERMEDIATE]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Álgebra Básica",
            description: "Resuelve ecuaciones y expresiones algebraicas simples",
            questionPatterns: [
              "Resuelve para x: {a}x + {b} = {c}",
              "Simplifica la expresión: {a}x + {b}x",
              "Si x = {a}, ¿cuál es el valor de {b}x + {c}?",
              "Encuentra el valor de y: {a}y - {b} = {c}"
            ],
            tags: ["álgebra", "ecuaciones", "variables", "simplificación"],
            hints: [
              "Aísla la variable en un lado de la ecuación",
              "Haz la misma operación en ambos lados",
              "Verifica tu respuesta sustituyendo el valor"
            ]
          }
        ]
      },
      {
        type: ExerciseType.APPLICATION,
        templates: [
          {
            title: "Geometría Práctica",
            description: "Calcula áreas, perímetros y volúmenes",
            questionPatterns: [
              "Un rectángulo tiene {a} cm de largo y {b} cm de ancho. ¿Cuál es su área?",
              "El perímetro de un cuadrado es {a} cm. ¿Cuánto mide cada lado?",
              "Una caja tiene dimensiones {a}×{b}×{c} cm. ¿Cuál es su volumen?",
              "El radio de un círculo es {a} cm. ¿Cuál es su área? (usa π ≈ 3.14)"
            ],
            tags: ["geometría", "área", "perímetro", "volumen", "fórmulas"],
            hints: [
              "Recuerda las fórmulas básicas: área = largo × ancho",
              "El perímetro es la suma de todos los lados",
              "El volumen es largo × ancho × alto"
            ]
          }
        ]
      }
    ],
    [Difficulty.ADVANCED]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Funciones y Gráficas",
            description: "Analiza y comprende funciones matemáticas",
            questionPatterns: [
              "Para la función f(x) = {a}x + {b}, encuentra f({c})",
              "¿Cuál es la pendiente de la recta y = {a}x + {b}?",
              "Una función lineal pasa por los puntos ({a},{b}) y ({c},{d}). Encuentra su ecuación",
              "Si f(x) = x² + {a}x + {b}, encuentra las raíces de la ecuación"
            ],
            tags: ["funciones", "gráficas", "pendiente", "ecuaciones cuadráticas"],
            hints: [
              "Sustituye el valor de x en la función",
              "La pendiente es el coeficiente de x",
              "Usa la fórmula: pendiente = (y₂-y₁)/(x₂-x₁)"
            ]
          }
        ]
      }
    ],
    [Difficulty.EXPERT]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Cálculo Diferencial",
            description: "Aplica conceptos de derivadas y límites",
            questionPatterns: [
              "Encuentra la derivada de f(x) = {a}x³ + {b}x² + {c}x + {d}",
              "Calcula el límite: lim(x→{a}) ({b}x² + {c}x) / ({d}x + {e})",
              "Una partícula se mueve según s(t) = {a}t² + {b}t. Encuentra su velocidad en t = {c}",
              "Encuentra los puntos críticos de f(x) = x³ - {a}x² + {b}x"
            ],
            tags: ["cálculo", "derivadas", "límites", "optimización"],
            hints: [
              "Usa las reglas de derivación: d/dx(xⁿ) = nxⁿ⁻¹",
              "La velocidad es la derivada de la posición",
              "Los puntos críticos ocurren cuando f'(x) = 0"
            ]
          }
        ]
      }
    ]
  },
  [Subject.PROGRAMMING]: {
    [Difficulty.BEGINNER]: [
      {
        type: ExerciseType.BASIC_CONCEPTS,
        templates: [
          {
            title: "Conceptos Fundamentales",
            description: "Comprende los conceptos básicos de programación",
            questionPatterns: [
              "¿Qué es una variable en programación?",
              "Explica la diferencia entre un bucle 'for' y 'while'",
              "¿Qué significa 'declarar' una variable?",
              "¿Cuál es la diferencia entre = y == en programación?",
              "¿Qué es un comentario en código y para qué sirve?"
            ],
            tags: ["variables", "bucles", "conceptos básicos", "sintaxis"],
            hints: [
              "Una variable es como una caja que guarda información",
              "Los bucles repiten acciones",
              "Los comentarios explican el código"
            ]
          },
          {
            title: "Tipos de Datos",
            description: "Identifica y trabaja con diferentes tipos de datos",
            questionPatterns: [
              "¿Qué tipo de dato es '{a}'? (string, number, boolean)",
              "¿Cuál es el resultado de '{a}' + '{b}' en JavaScript?",
              "¿Verdadero o falso? El número {a} es mayor que {b}",
              "¿Qué tipo de dato almacena verdadero/falso?"
            ],
            tags: ["tipos de datos", "string", "number", "boolean"],
            hints: [
              "Los strings van entre comillas",
              "Los números no necesitan comillas",
              "Boolean solo puede ser true o false"
            ]
          }
        ]
      }
    ],
    [Difficulty.INTERMEDIATE]: [
      {
        type: ExerciseType.APPLICATION,
        templates: [
          {
            title: "Algoritmos Básicos",
            description: "Desarrolla algoritmos y lógica de programación",
            questionPatterns: [
              "Escribe un algoritmo para encontrar el número mayor entre {a}, {b} y {c}",
              "¿Cómo ordenarías los números [{a}, {b}, {c}] de menor a mayor?",
              "Describe un algoritmo para verificar si un número es par",
              "¿Qué pasos seguirías para buscar un nombre en una lista?"
            ],
            tags: ["algoritmos", "lógica", "búsqueda", "ordenamiento"],
            hints: [
              "Piensa paso a paso",
              "Compara elementos de dos en dos",
              "Un número par es divisible por 2"
            ]
          },
          {
            title: "Funciones y Métodos",
            description: "Comprende y diseña funciones",
            questionPatterns: [
              "Diseña una función que calcule el área de un rectángulo",
              "¿Qué parámetros necesita una función para calcular la edad?",
              "Escribe una función que determine si un año es bisiesto",
              "¿Cuál es la diferencia entre parámetros y argumentos?"
            ],
            tags: ["funciones", "parámetros", "retorno", "modularidad"],
            hints: [
              "Una función recibe datos (parámetros) y devuelve un resultado",
              "Los parámetros son variables de entrada",
              "Divide problemas grandes en funciones pequeñas"
            ]
          }
        ]
      }
    ],
    [Difficulty.ADVANCED]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Estructuras de Datos",
            description: "Trabaja con arrays, objetos y estructuras complejas",
            questionPatterns: [
              "¿Cuál es la complejidad temporal de buscar en un array ordenado?",
              "Explica la diferencia entre un array y una lista enlazada",
              "¿Cuándo usarías un hash table en lugar de un array?",
              "Diseña una estructura de datos para un sistema de calificaciones"
            ],
            tags: ["estructuras de datos", "complejidad", "arrays", "objetos"],
            hints: [
              "Piensa en eficiencia: tiempo vs espacio",
              "Arrays son buenos para acceso aleatorio",
              "Hash tables son rápidos para búsquedas"
            ]
          }
        ]
      }
    ],
    [Difficulty.EXPERT]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Algoritmos Avanzados",
            description: "Implementa algoritmos complejos y optimizaciones",
            questionPatterns: [
              "Implementa un algoritmo de ordenamiento quicksort",
              "¿Cómo optimizarías una búsqueda en un árbol binario?",
              "Diseña un algoritmo para detectar ciclos en un grafo",
              "Explica el algoritmo de Dijkstra para encontrar el camino más corto"
            ],
            tags: ["algoritmos avanzados", "optimización", "grafos", "árboles"],
            hints: [
              "Divide y vencerás es una estrategia poderosa",
              "Los árboles balanceados mejoran la eficiencia",
              "Considera el caso promedio y el peor caso"
            ]
          }
        ]
      }
    ]
  },
  [Subject.SCIENCE]: {
    [Difficulty.BEGINNER]: [
      {
        type: ExerciseType.BASIC_CONCEPTS,
        templates: [
          {
            title: "Método Científico",
            description: "Comprende los pasos del método científico",
            questionPatterns: [
              "¿Cuáles son los pasos básicos del método científico?",
              "¿Qué es una hipótesis y cómo se formula?",
              "¿Por qué es importante tener un grupo de control en un experimento?",
              "¿Cuál es la diferencia entre observación y conclusión?"
            ],
            tags: ["método científico", "hipótesis", "experimento", "observación"],
            hints: [
              "El método científico es una forma sistemática de investigar",
              "Una hipótesis es una explicación que se puede probar",
              "Los controles ayudan a aislar variables"
            ]
          }
        ]
      }
    ],
    [Difficulty.INTERMEDIATE]: [
      {
        type: ExerciseType.APPLICATION,
        templates: [
          {
            title: "Física Básica",
            description: "Aplica conceptos de movimiento y fuerzas",
            questionPatterns: [
              "Un objeto cae desde {a} metros de altura. ¿Cuánto tiempo tarda en caer? (g = 9.8 m/s²)",
              "Un coche viaja a {a} km/h durante {b} horas. ¿Qué distancia recorre?",
              "¿Cuál es la fuerza neta si se aplican {a}N hacia la derecha y {b}N hacia la izquierda?",
              "Calcula la velocidad final de un objeto que acelera a {a} m/s² durante {b} segundos"
            ],
            tags: ["física", "movimiento", "fuerzas", "cinemática"],
            hints: [
              "Usa las ecuaciones de movimiento uniformemente acelerado",
              "Velocidad = distancia / tiempo",
              "La fuerza neta es la suma vectorial de todas las fuerzas"
            ]
          }
        ]
      }
    ],
    [Difficulty.ADVANCED]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Química Avanzada",
            description: "Analiza reacciones químicas y equilibrios",
            questionPatterns: [
              "Balancea la ecuación: C₆H₁₂O₆ + O₂ → CO₂ + H₂O",
              "¿Cuál es la concentración molar de una solución con {a}g de NaCl en {b}L de agua?",
              "Explica cómo afecta la temperatura al equilibrio de una reacción exotérmica",
              "Calcula el pH de una solución 0.{a}M de HCl"
            ],
            tags: ["química", "equilibrio", "concentración", "pH"],
            hints: [
              "Conserva la masa en las ecuaciones químicas",
              "Molaridad = moles de soluto / litros de solución",
              "Le Chatelier describe cambios en equilibrio"
            ]
          }
        ]
      }
    ],
    [Difficulty.EXPERT]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Biología Molecular",
            description: "Analiza procesos celulares y genéticos",
            questionPatterns: [
              "Explica el proceso de transcripción del ADN al ARN",
              "¿Cómo afecta una mutación puntual en un codón de parada?",
              "Describe el mecanismo de la fotosíntesis en detalle",
              "¿Qué papel juegan las enzimas en el metabolismo celular?"
            ],
            tags: ["biología molecular", "genética", "enzimas", "metabolismo"],
            hints: [
              "La transcripción copia información genética",
              "Los codones determinan aminoácidos",
              "Las enzimas catalizan reacciones bioquímicas"
            ]
          }
        ]
      }
    ]
  },
  [Subject.LANGUAGE]: {
    [Difficulty.BEGINNER]: [
      {
        type: ExerciseType.BASIC_CONCEPTS,
        templates: [
          {
            title: "Gramática Básica",
            description: "Practica conceptos fundamentales de gramática",
            questionPatterns: [
              "Identifica el sujeto en la oración: 'El gato duerme en el sofá'",
              "¿Cuál es el verbo en: 'María estudia matemáticas'?",
              "Clasifica la palabra '{a}': ¿es sustantivo, verbo o adjetivo?",
              "¿Está correctamente escrita la palabra '{a}'?"
            ],
            tags: ["gramática", "sujeto", "verbo", "ortografía"],
            hints: [
              "El sujeto es quien realiza la acción",
              "El verbo expresa la acción",
              "Los sustantivos nombran personas, lugares o cosas"
            ]
          }
        ]
      }
    ],
    [Difficulty.INTERMEDIATE]: [
      {
        type: ExerciseType.APPLICATION,
        templates: [
          {
            title: "Comprensión Lectora",
            description: "Analiza textos y extrae información importante",
            questionPatterns: [
              "Lee el párrafo y resume la idea principal en una oración",
              "¿Cuál es el tono del autor en este texto: formal, informal, o académico?",
              "Identifica las palabras clave que apoyan el argumento principal",
              "¿Qué técnica narrativa usa el autor: primera persona, tercera persona, etc.?"
            ],
            tags: ["comprensión lectora", "análisis", "tono", "estructura"],
            hints: [
              "La idea principal suele estar al inicio o al final",
              "El tono se refleja en el vocabulario usado",
              "Las palabras clave se repiten a lo largo del texto"
            ]
          }
        ]
      }
    ],
    [Difficulty.ADVANCED]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Análisis Literario",
            description: "Analiza elementos literarios y estilísticos",
            questionPatterns: [
              "Analiza el uso de metáforas en este poema y su significado",
              "¿Cómo contribuye el narrador a la atmósfera de la historia?",
              "Explica la ironía presente en este fragmento",
              "¿Qué simbolismo encuentras en la descripción del paisaje?"
            ],
            tags: ["análisis literario", "metáforas", "simbolismo", "ironía"],
            hints: [
              "Las metáforas comparan sin usar 'como'",
              "El narrador puede ser confiable o no",
              "La ironía contrasta expectativa con realidad"
            ]
          }
        ]
      }
    ],
    [Difficulty.EXPERT]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Crítica Literaria",
            description: "Desarrolla ensayos críticos y análisis profundos",
            questionPatterns: [
              "Desarrolla una tesis sobre el tema del poder en esta obra",
              "Compara el estilo narrativo de dos autores diferentes",
              "¿Cómo refleja esta obra el contexto histórico de su época?",
              "Analiza la evolución del protagonista a lo largo de la narrativa"
            ],
            tags: ["crítica literaria", "tesis", "contexto histórico", "evolución"],
            hints: [
              "Una tesis debe ser específica y argumentable",
              "El contexto histórico influye en los temas",
              "La evolución de personajes muestra crecimiento"
            ]
          }
        ]
      }
    ]
  },
  [Subject.GENERAL]: {
    [Difficulty.BEGINNER]: [
      {
        type: ExerciseType.REFLECTION,
        templates: [
          {
            title: "Reflexión Personal",
            description: "Desarrolla tu capacidad de autorreflexión",
            questionPatterns: [
              "¿Cuáles fueron tus principales logros esta semana?",
              "¿Qué estrategia de estudio te resulta más efectiva y por qué?",
              "Describe un momento en que superaste una dificultad académica",
              "¿Cómo has mejorado en {a} desde el inicio del curso?",
              "¿Qué meta te gustaría alcanzar la próxima semana?"
            ],
            tags: ["reflexión", "metacognición", "aprendizaje", "crecimiento"],
            hints: [
              "Sé honesto contigo mismo",
              "Piensa en ejemplos específicos",
              "Considera tanto los aspectos positivos como los desafíos"
            ]
          }
        ]
      },
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Pensamiento Crítico",
            description: "Desarrolla habilidades de análisis y razonamiento",
            questionPatterns: [
              "¿Por qué es importante verificar las fuentes de información?",
              "Analiza las ventajas y desventajas de estudiar en grupo",
              "¿Cómo puedes distinguir entre un hecho y una opinión?",
              "¿Qué preguntas harías para evaluar la credibilidad de una noticia?"
            ],
            tags: ["pensamiento crítico", "análisis", "fuentes", "credibilidad"],
            hints: [
              "Cuestiona la información que recibes",
              "Busca evidencia que respalde las afirmaciones",
              "Considera múltiples perspectivas"
            ]
          }
        ]
      }
    ],
    [Difficulty.INTERMEDIATE]: [
      {
        type: ExerciseType.APPLICATION,
        templates: [
          {
            title: "Resolución de Problemas",
            description: "Aplica estrategias para resolver problemas complejos",
            questionPatterns: [
              "Describe una estrategia para gestionar mejor tu tiempo de estudio",
              "¿Cómo abordarías un proyecto que parece abrumador?",
              "¿Qué pasos seguirías para prepararte para un examen difícil?",
              "¿Cómo puedes mantener la motivación durante períodos difíciles?"
            ],
            tags: ["resolución de problemas", "gestión del tiempo", "estrategias"],
            hints: [
              "Divide los problemas grandes en partes pequeñas",
              "Establece prioridades claras",
              "Busca patrones en problemas similares"
            ]
          }
        ]
      }
    ],
    [Difficulty.ADVANCED]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Análisis Ético",
            description: "Examina dilemas éticos y toma de decisiones",
            questionPatterns: [
              "¿Es ético usar IA para hacer tareas académicas? Justifica tu respuesta",
              "Analiza los aspectos éticos de la investigación científica en humanos",
              "¿Cuándo es apropiado romper una regla? Proporciona un ejemplo",
              "¿Cómo balanceas la competencia académica con la colaboración?"
            ],
            tags: ["ética", "dilemas", "toma de decisiones", "valores"],
            hints: [
              "Considera las consecuencias de las acciones",
              "Piensa en diferentes stakeholders afectados",
              "Reflexiona sobre tus valores fundamentales"
            ]
          }
        ]
      }
    ],
    [Difficulty.EXPERT]: [
      {
        type: ExerciseType.CRITICAL_THINKING,
        templates: [
          {
            title: "Filosofía del Aprendizaje",
            description: "Explora conceptos profundos sobre educación y conocimiento",
            questionPatterns: [
              "¿Cuál es la diferencia entre información, conocimiento y sabiduría?",
              "¿Cómo ha cambiado la educación con la tecnología digital?",
              "¿Qué papel debe jugar la IA en la educación del futuro?",
              "¿Es posible un aprendizaje completamente objetivo? ¿Por qué?"
            ],
            tags: ["filosofía", "epistemología", "educación", "futuro"],
            hints: [
              "Considera diferentes perspectivas filosóficas",
              "Piensa en las implicaciones a largo plazo",
              "Reflexiona sobre la naturaleza del conocimiento"
            ]
          }
        ]
      }
    ]
  }
}