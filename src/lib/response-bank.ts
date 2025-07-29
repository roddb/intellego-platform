// Sistema de Banco de Respuestas Personalizadas para Sara
// Proporciona respuestas variadas y contextuales basadas en emociones, situaciones y personalidad

import { EmotionType } from './emotion-analyzer'
import { ConversationMode } from './advanced-intent-engine'

export interface ResponseContext {
  emotion: EmotionType
  mode: ConversationMode
  subject?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  studentLevel?: 'beginner' | 'intermediate' | 'advanced'
  previousInteraction?: 'positive' | 'negative' | 'neutral'
  urgency?: 'low' | 'medium' | 'high'
  sessionLength?: 'short' | 'medium' | 'long'
}

export interface PersonalizedResponse {
  content: string
  tone: 'formal' | 'casual' | 'empathetic' | 'encouraging' | 'professional' | 'motivational'
  followUp?: string[]
  suggestedActions?: string[]
  emoji?: string
  priority: number // 1-10, mayor prioridad = más específico/relevante
}

export class ResponseBank {
  
  // Respuestas específicas por emoción y contexto
  private static readonly EMOTION_RESPONSES: { [key in EmotionType]: PersonalizedResponse[] } = {
    
    [EmotionType.FRUSTRATED]: [
      {
        content: "Entiendo perfectamente tu frustración. Es una reacción completamente normal cuando nos enfrentamos a desafíos complicados.",
        tone: 'empathetic',
        followUp: ["¿Qué parte específica te está costando más trabajo?", "¿Te gustaría que abordemos esto desde otro ángulo?"],
        suggestedActions: ["Tomar un descanso de 5 minutos", "Dividir el problema en pasos más pequeños", "Revisar conceptos básicos"],
        emoji: "🤗",
        priority: 8
      },
      {
        content: "La frustración es señal de que te importa lograr tus objetivos. Eso es admirable, y vamos a canalizar esa energía de manera positiva.",
        tone: 'motivational',
        followUp: ["¿Qué has intentado hasta ahora?", "¿Cuál crees que podría ser un primer paso más pequeño?"],
        suggestedActions: ["Respirar profundo", "Escribir qué específicamente no entiendes", "Buscar ejemplos simples"],
        emoji: "💪",
        priority: 7
      },
      {
        content: "Sé que esto es frustrante ahora mismo. He ayudado a muchos estudiantes en situaciones similares, y te aseguro que encontraremos la forma de que esto tenga sentido para ti.",
        tone: 'empathetic',
        followUp: ["¿Prefieres que simplifiquemos el enfoque?", "¿Te ayudaría ver esto con ejemplos prácticos?"],
        suggestedActions: ["Cambiar de estrategia de estudio", "Usar analogías simples", "Practicar con ejercicios básicos"],
        emoji: "🌟",
        priority: 6
      }
    ],

    [EmotionType.OVERWHELMED]: [
      {
        content: "Cuando te sientes abrumado, lo más importante es recordar que no tienes que hacerlo todo de una vez. Vamos a organizarlo juntos.",
        tone: 'empathetic',
        followUp: ["¿Cuáles son las tareas más urgentes?", "¿Qué fecha límite te preocupa más?"],
        suggestedActions: ["Hacer una lista de prioridades", "Dividir tareas grandes en pequeñas", "Establecer horarios específicos"],
        emoji: "🗂️",
        priority: 9
      },
      {
        content: "Es normal sentirse abrumado con tantas responsabilidades. La clave está en tomar control paso a paso, y yo te voy a acompañar en el proceso.",
        tone: 'professional',
        followUp: ["¿Qué tal si priorizamos por urgencia?", "¿Hay algo que podamos delegar o posponer?"],
        suggestedActions: ["Técnica Pomodoro", "Matriz de Eisenhower", "Descansos programados"],
        emoji: "📋",
        priority: 8
      }
    ],

    [EmotionType.ANXIOUS]: [
      {
        content: "La ansiedad es tu mente tratando de prepararte para algo importante. Vamos a convertir esa energía nerviosa en preparación efectiva.",
        tone: 'empathetic',
        followUp: ["¿Qué específicamente te preocupa más?", "¿Has tenido experiencias similares antes?"],
        suggestedActions: ["Técnicas de respiración", "Visualización positiva", "Preparación estructurada"],
        emoji: "🧘‍♀️",
        priority: 9
      },
      {
        content: "Entiendo que sientes ansiedad. Es importante que sepas que estar nervioso también puede ser señal de que te importa hacer las cosas bien.",
        tone: 'empathetic',
        followUp: ["¿Te ayudaría repasar lo que ya sabes?", "¿Qué te tranquilizaría más en este momento?"],
        suggestedActions: ["Repasar material conocido", "Simular la situación", "Hablar con alguien de confianza"],
        emoji: "💚",
        priority: 8
      }
    ],

    [EmotionType.CONFUSED]: [
      {
        content: "La confusión es el primer paso hacia la comprensión. Significa que tu mente está procesando nueva información. Vamos a aclarar las dudas juntos.",
        tone: 'professional',
        followUp: ["¿En qué punto específico perdiste el hilo?", "¿Te gustaría que empecemos desde un concepto más básico?"],
        suggestedActions: ["Mapas conceptuales", "Explicaciones paso a paso", "Ejemplos concretos"],
        emoji: "🤔",
        priority: 9
      },
      {
        content: "No te preocupes por estar confundido. Es totalmente normal cuando aprendemos algo nuevo. Mi trabajo es hacer que todo esto tenga sentido para ti.",
        tone: 'encouraging',
        followUp: ["¿Qué parte entiendes bien hasta ahora?", "¿Desde dónde te gustaría que empezáramos?"],
        suggestedActions: ["Revisar prerrequisitos", "Usar analogías", "Práctica guiada"],
        emoji: "💡",
        priority: 8
      }
    ],

    [EmotionType.MOTIVATED]: [
      {
        content: "¡Me encanta ver tu motivación! Esta es la actitud perfecta para lograr grandes cosas. Vamos a aprovechar esta energía al máximo.",
        tone: 'encouraging',
        followUp: ["¿Qué objetivo específico quieres alcanzar?", "¿Cómo te imaginas celebrando cuando lo logres?"],
        suggestedActions: ["Establecer metas claras", "Crear plan de acción", "Tracking de progreso"],
        emoji: "🚀",
        priority: 9
      },
      {
        content: "Tu motivación es contagiosa. Con esta actitud, estoy segura de que vas a superar cualquier desafío que se presente.",
        tone: 'motivational',
        followUp: ["¿En qué área quieres enfocarte primero?", "¿Qué te inspira más de este objetivo?"],
        suggestedActions: ["Objetivos SMART", "Recompensas por progreso", "Visualización del éxito"],
        emoji: "⭐",
        priority: 8
      }
    ],

    [EmotionType.PROUD]: [
      {
        content: "¡Qué orgullo me da ver tu progreso! Te mereces celebrar este logro. Has trabajado duro para llegar hasta aquí.",
        tone: 'encouraging',
        followUp: ["¿Cómo te sientes con lo que has logrado?", "¿Qué fue lo que más te ayudó a conseguirlo?"],
        suggestedActions: ["Reflexionar sobre el proceso", "Compartir el logro", "Establecer siguiente meta"],
        emoji: "🎉",
        priority: 9
      },
      {
        content: "Es maravilloso verte tan satisfecho con tu trabajo. Este tipo de logros construyen confianza para enfrentar desafíos futuros.",
        tone: 'encouraging',
        followUp: ["¿Qué estrategia te funcionó mejor?", "¿Te sientes listo para el siguiente nivel?"],
        suggestedActions: ["Documentar la estrategia exitosa", "Enseñar a otros", "Aplicar lo aprendido"],
        emoji: "👏",
        priority: 8
      }
    ],

    [EmotionType.GRATEFUL]: [
      {
        content: "Me alegra mucho saber que mi ayuda te ha sido útil. Ver tu progreso y crecimiento es exactamente la razón por la cual estoy aquí.",
        tone: 'encouraging',
        followUp: ["¿Hay algo más en lo que pueda apoyarte?", "¿Te sientes preparado para continuar por tu cuenta?"],
        suggestedActions: ["Practicar independientemente", "Ayudar a otros estudiantes", "Reflexionar sobre el aprendizaje"],
        emoji: "😊",
        priority: 9
      },
      {
        content: "Tu gratitud significa mucho para mí. Es un placer acompañarte en tu camino de aprendizaje y ver cómo cada día te vuelves más capaz.",
        tone: 'encouraging',
        followUp: ["¿Qué aspecto de nuestro trabajo juntos te ha resultado más valioso?"],
        suggestedActions: ["Continuar practicando", "Mantener la curiosidad", "Seguir preguntando"],
        emoji: "💝",
        priority: 8
      }
    ],

    [EmotionType.EXCITED]: [
      {
        content: "¡Tu entusiasmo es fantástico! Esta energía positiva es el combustible perfecto para el aprendizaje. Vamos a canalizar toda esa emoción.",
        tone: 'encouraging',
        followUp: ["¿Qué te emociona más de esto?", "¿Cómo podemos aprovechar esta motivación?"],
        suggestedActions: ["Explorar temas relacionados", "Crear proyectos personales", "Compartir el entusiasmo"],
        emoji: "✨",
        priority: 9
      },
      {
        content: "Me encanta ver tu emoción por aprender. Los estudiantes que se entusiasman así son los que realmente transforman su conocimiento en algo extraordinario.",
        tone: 'motivational',
        followUp: ["¿Te gustaría profundizar en algún aspecto específico?", "¿Qué otros temas te despiertan curiosidad?"],
        suggestedActions: ["Investigación independiente", "Proyectos creativos", "Conectar con otros entusiastas"],
        emoji: "🌟",
        priority: 8
      }
    ],

    [EmotionType.DISAPPOINTED]: [
      {
        content: "Entiendo tu decepción, y es válido sentirse así cuando las cosas no salen como esperábamos. Esto no define tu capacidad, solo es información para mejorar.",
        tone: 'empathetic',
        followUp: ["¿Qué específicamente no salió como esperabas?", "¿Qué aprendizajes puedes sacar de esta experiencia?"],
        suggestedActions: ["Analizar qué pasó", "Ajustar estrategias", "Establecer expectativas realistas"],
        emoji: "🤗",
        priority: 9
      },
      {
        content: "La decepción duele, pero también puede ser un maestro valioso. Los estudiantes más exitosos han pasado por momentos como este y han salido más fuertes.",
        tone: 'empathetic',
        followUp: ["¿Te gustaría hablar sobre lo que pasó?", "¿Cómo podemos enfocar esto de manera diferente?"],
        suggestedActions: ["Reflexión constructiva", "Buscar feedback", "Replantear objetivos"],
        emoji: "💚",
        priority: 8
      }
    ],

    [EmotionType.CURIOUS]: [
      {
        content: "¡Me encanta tu curiosidad! Las preguntas son el motor del aprendizaje real. Vamos a explorar todo lo que quieras saber.",
        tone: 'encouraging',
        followUp: ["¿Qué te gustaría descubrir primero?", "¿Hay algo específico que te ha despertado esta curiosidad?"],
        suggestedActions: ["Investigación guiada", "Experimentación práctica", "Preguntas abiertas"],
        emoji: "🔍",
        priority: 9
      },
      {
        content: "Tu curiosidad es una herramienta poderosa. Los estudiantes curiosos como tú son los que hacen conexiones innovadoras y descubren cosas fascinantes.",
        tone: 'encouraging',
        followUp: ["¿Desde qué ángulo te gustaría abordar esto?", "¿Qué hipótesis tienes sobre esto?"],
        suggestedActions: ["Exploración libre", "Hacer experimentos", "Buscar múltiples perspectivas"],
        emoji: "🧩",
        priority: 8
      }
    ],

    [EmotionType.BORED]: [
      {
        content: "Entiendo que esto pueda parecer aburrido ahora mismo. Vamos a encontrar una forma más interesante de abordar el tema que conecte con tus intereses.",
        tone: 'motivational',
        followUp: ["¿Qué temas te resultan más interesantes?", "¿Cómo podríamos hacer esto más relevante para ti?"],
        suggestedActions: ["Buscar aplicaciones prácticas", "Cambiar de formato", "Conectar con intereses personales"],
        emoji: "🎯",
        priority: 9
      },
      {
        content: "El aburrimiento a veces es señal de que necesitamos un enfoque diferente. Todos los temas tienen aspectos fascinantes cuando los miramos desde el ángulo correcto.",
        tone: 'motivational',
        followUp: ["¿Qué te parece más relevante en tu vida diaria?", "¿Te gustaría que busquemos ejemplos más interesantes?"],
        suggestedActions: ["Gamificación", "Ejemplos del mundo real", "Aprendizaje activo"],
        emoji: "⚡",
        priority: 8
      }
    ],

    [EmotionType.STRESSED]: [
      {
        content: "El estrés puede ser abrumador, pero también puede ser señal de que te importa hacer las cosas bien. Vamos a encontrar formas de manejarlo efectivamente.",
        tone: 'empathetic',
        followUp: ["¿Qué es lo que más te está estresando ahora?", "¿Has probado alguna técnica de manejo del estrés?"],
        suggestedActions: ["Técnicas de relajación", "Organización del tiempo", "Ejercicio físico"],
        emoji: "🧘‍♀️",
        priority: 9
      },
      {
        content: "Cuando estamos estresados, nuestro cerebro puede bloquearse. Vamos a crear un ambiente más relajado para que puedas pensar con claridad.",
        tone: 'empathetic',
        followUp: ["¿Te ayudaría tomar un descanso primero?", "¿Qué normalmente te ayuda a relajarte?"],
        suggestedActions: ["Respiración profunda", "Descansos frecuentes", "Priorización de tareas"],
        emoji: "🌸",
        priority: 8
      }
    ],

    // Emociones básicas con respuestas contextuales
    [EmotionType.HAPPY]: [
      {
        content: "¡Qué alegría verte tan feliz! Esta energía positiva es perfecta para aprender y crear cosas increíbles.",
        tone: 'encouraging',
        followUp: ["¿Qué te tiene tan contento?", "¿Cómo podemos aprovechar esta buena energía?"],
        suggestedActions: ["Aprovechar el momento", "Tackle desafíos", "Compartir la alegría"],
        emoji: "😄",
        priority: 7
      }
    ],

    [EmotionType.SAD]: [
      {
        content: "Veo que no te sientes muy bien. Está bien tener días difíciles. Estoy aquí para apoyarte en lo que necesites.",
        tone: 'empathetic',
        followUp: ["¿Te gustaría hablar sobre lo que te tiene triste?", "¿Hay algo que pueda hacer para ayudarte?"],
        suggestedActions: ["Hablar con alguien", "Actividades que te gusten", "Tomar las cosas con calma"],
        emoji: "🤗",
        priority: 8
      }
    ],

    [EmotionType.CONFIDENT]: [
      {
        content: "Me encanta ver tu confianza. Esa seguridad en ti mismo es una base sólida para lograr cualquier cosa que te propongas.",
        tone: 'encouraging',
        followUp: ["¿Qué te ha dado esa confianza?", "¿Estás listo para un nuevo desafío?"],
        suggestedActions: ["Asumir nuevos retos", "Ayudar a otros", "Expandir conocimientos"],
        emoji: "💪",
        priority: 8
      }
    ],

    [EmotionType.HOPEFUL]: [
      {
        content: "Tu esperanza es muy valiosa. Mantener esa actitud positiva hacia el futuro te va a llevar lejos.",
        tone: 'encouraging',
        followUp: ["¿Qué te da esa esperanza?", "¿Cómo podemos trabajar hacia esa visión?"],
        suggestedActions: ["Planificar pasos concretos", "Mantener optimismo", "Celebrar pequeños avances"],
        emoji: "🌈",
        priority: 7
      }
    ],

    [EmotionType.RELIEVED]: [
      {
        content: "Qué alivio debe ser haber superado eso. Es una sensación maravillosa cuando las cosas finalmente encajan.",
        tone: 'encouraging',
        followUp: ["¿Cómo te sientes ahora que pasó?", "¿Qué aprendiste del proceso?"],
        suggestedActions: ["Reflexionar sobre el aprendizaje", "Descansar", "Prepararse para lo siguiente"],
        emoji: "😌",
        priority: 7
      }
    ],

    [EmotionType.ANGRY]: [
      {
        content: "Entiendo que estés enojado. A veces las emociones fuertes son señal de que algo necesita cambiar. Vamos a canalizar esa energía de forma constructiva.",
        tone: 'empathetic',
        followUp: ["¿Qué específicamente te tiene molesto?", "¿Cómo podríamos abordar esto de manera diferente?"],
        suggestedActions: ["Tomar un respiro", "Identificar la causa", "Buscar soluciones"],
        emoji: "🤗",
        priority: 8
      }
    ],

    [EmotionType.FEAR]: [
      {
        content: "Es normal sentir miedo ante lo desconocido. El coraje no es la ausencia de miedo, sino actuar a pesar de él.",
        tone: 'empathetic',
        followUp: ["¿Qué específicamente te da miedo?", "¿Cómo podemos hacer esto menos intimidante?"],
        suggestedActions: ["Preparación gradual", "Apoyo adicional", "Técnicas de relajación"],
        emoji: "🤗",
        priority: 8
      }
    ],

    [EmotionType.SURPRISE]: [
      {
        content: "¡Qué sorpresa interesante! A veces los descubrimientos inesperados son los más valiosos.",
        tone: 'encouraging',
        followUp: ["¿Qué te sorprendió más?", "¿Cómo cambió esto tu perspectiva?"],
        suggestedActions: ["Explorar más", "Conectar con conocimientos previos", "Documentar el descubrimiento"],
        emoji: "😲",
        priority: 6
      }
    ],

    [EmotionType.NEUTRAL]: [
      {
        content: "Perfecto, vamos a trabajar juntos en esto. Estoy aquí para ayudarte con cualquier cosa que necesites.",
        tone: 'professional',
        followUp: ["¿Por dónde te gustaría empezar?", "¿Hay algo específico en lo que quieres enfocarte?"],
        suggestedActions: ["Establecer objetivos claros", "Evaluar conocimientos previos", "Crear plan de trabajo"],
        emoji: "📚",
        priority: 5
      }
    ]
  }

  // Respuestas específicas por contexto y situación
  private static readonly CONTEXTUAL_RESPONSES = {
    
    // Respuestas por hora del día
    timeOfDay: {
      morning: [
        "¡Buenos días! Me encanta empezar el día aprendiendo algo nuevo. Tu mente está fresca y lista para absorber información.",
        "¡Qué buena hora para estudiar! Las mañanas son perfectas para temas que requieren concentración."
      ],
      afternoon: [
        "¡Buenas tardes! Es un momento excelente para repasar y consolidar lo que has aprendido en la mañana.",
        "La tarde es ideal para práctica y aplicación. Vamos a poner en acción lo que sabes."
      ],
      evening: [
        "¡Buenas tardes! Las tardes son perfectas para reflexionar sobre lo aprendido y planificar el siguiente día.",
        "Aprovechemos esta hora más relajada para conceptos que requieren reflexión profunda."
      ],
      night: [
        "¡Qué dedicación estudiar a esta hora! Asegurémonos de que puedas descansar bien después de nuestra sesión.",
        "Las noches pueden ser muy productivas para ciertos tipos de estudio. Vamos a hacer que valga la pena."
      ]
    },

    // Respuestas por materia
    subjects: {
      'matemáticas': [
        "Las matemáticas son como un idioma universal. Una vez que entiendes la lógica, todo empieza a tener sentido.",
        "En matemáticas, cada error es una oportunidad de aprender. Vamos a convertir las dificultades en entendimiento."
      ],
      'química': [
        "La química es fascinante porque explica cómo funciona el mundo a nivel molecular. Cada reacción cuenta una historia.",
        "En química, la práctica con problemas reales te ayuda a visualizar los conceptos abstractos."
      ],
      'física': [
        "La física nos ayuda a entender el universo desde lo más pequeño hasta lo más grande. Es pura elegancia matemática.",
        "En física, los conceptos están conectados. Una vez que veas las relaciones, todo se vuelve más claro."
      ],
      'historia': [
        "La historia nos enseña que los eventos del pasado moldean nuestro presente. Cada época tiene lecciones valiosas.",
        "Estudiar historia es como ser un detective del tiempo, conectando pistas para entender grandes narrativas."
      ],
      'literatura': [
        "La literatura nos permite vivir mil vidas diferentes y entender la experiencia humana desde múltiples perspectivas.",
        "Cada texto literario es un mundo. Vamos a explorarlo juntos y descubrir sus secretos."
      ]
    },

    // Respuestas por urgencia
    urgency: {
      high: [
        "Entiendo que esto es urgente. Vamos a enfocarnos en lo más importante y hacer que cada minuto cuente.",
        "Con tiempo limitado, la clave es priorizar. Vamos directo a lo esencial."
      ],
      medium: [
        "Tenemos tiempo suficiente para hacer esto bien. Vamos a ser metódicos pero eficientes.",
        "Perfecto, podemos tomarnos el tiempo necesario para entender todo a fondo."
      ],
      low: [
        "¡Excelente! Con tiempo de sobra podemos explorar el tema en profundidad y hasta ver extensiones interesantes.",
        "Con esta tranquilidad podemos realmente disfrutar el proceso de aprendizaje."
      ]
    }
  }

  // Respuestas motivacionales por tiempo de sesión
  private static readonly SESSION_RESPONSES = {
    short: [
      "Aprovechemos estos minutos al máximo. Vamos a ser súper eficientes.",
      "Sesiones cortas pero intensas pueden ser muy efectivas. ¡Enfoquémonos!"
    ],
    medium: [
      "Tenemos un buen tiempo para trabajar. Vamos a dividirlo en segmentos productivos.",
      "Esta duración es perfecta para abordar varios aspectos del tema."
    ],
    long: [
      "Con tanto tiempo disponible podemos profundizar realmente. ¡Va a ser una sesión increíble!",
      "Excelente, podemos tomarnos descansos y trabajar a un ritmo cómodo pero productivo."
    ]
  }

  /**
   * Selecciona la respuesta más apropiada basada en el contexto completo
   */
  static selectPersonalizedResponse(context: ResponseContext): PersonalizedResponse {
    const emotionResponses = this.EMOTION_RESPONSES[context.emotion] || this.EMOTION_RESPONSES[EmotionType.NEUTRAL]
    
    // Filtrar respuestas por contexto adicional
    let suitableResponses = emotionResponses.filter(response => {
      // Filtrar por modo si es relevante
      if (context.mode === ConversationMode.TUTORING && response.tone === 'casual') return false
      if (context.mode === ConversationMode.CHATTING && response.tone === 'professional') return false
      
      return true
    })

    // Si no hay respuestas adecuadas, usar todas las de la emoción
    if (suitableResponses.length === 0) {
      suitableResponses = emotionResponses
    }

    // Ordenar por prioridad y seleccionar la mejor
    suitableResponses.sort((a, b) => b.priority - a.priority)
    let selectedResponse = suitableResponses[0]

    // Enriquecer la respuesta con contexto adicional
    selectedResponse = this.enrichWithContext(selectedResponse, context)

    return selectedResponse
  }

  /**
   * Enriquece una respuesta base con contexto adicional
   */
  private static enrichWithContext(baseResponse: PersonalizedResponse, context: ResponseContext): PersonalizedResponse {
    let enrichedContent = baseResponse.content

    // Agregar saludo contextual por hora
    if (context.timeOfDay) {
      const timeGreetings = this.CONTEXTUAL_RESPONSES.timeOfDay[context.timeOfDay]
      if (Math.random() < 0.3) { // 30% de probabilidad de agregar contexto temporal
        enrichedContent = `${timeGreetings[Math.floor(Math.random() * timeGreetings.length)]} ${enrichedContent}`
      }
    }

    // Agregar contexto de materia si es relevante
    if (context.subject && this.CONTEXTUAL_RESPONSES.subjects[context.subject]) {
      const subjectResponses = this.CONTEXTUAL_RESPONSES.subjects[context.subject]
      if (Math.random() < 0.4) { // 40% de probabilidad
        enrichedContent += ` ${subjectResponses[Math.floor(Math.random() * subjectResponses.length)]}`
      }
    }

    // Enriquecer acciones sugeridas basadas en urgencia
    let enrichedActions = [...(baseResponse.suggestedActions || [])]
    if (context.urgency === 'high') {
      enrichedActions.unshift("Enfoque en lo esencial", "Técnica de 25 minutos")
    } else if (context.urgency === 'low') {
      enrichedActions.push("Explorar temas relacionados", "Profundizar conceptos")
    }

    // Ajustar follow-ups basado en la duración de sesión
    let enrichedFollowUps = [...(baseResponse.followUp || [])]
    if (context.sessionLength === 'long') {
      enrichedFollowUps.push("¿Te gustaría que exploremos esto más a fondo?", "¿Qué otros aspectos te interesan?")
    } else if (context.sessionLength === 'short') {
      enrichedFollowUps = enrichedFollowUps.slice(0, 1) // Solo una pregunta de seguimiento
    }

    return {
      ...baseResponse,
      content: enrichedContent,
      suggestedActions: enrichedActions,
      followUp: enrichedFollowUps
    }
  }

  /**
   * Genera una respuesta completamente aleatoria para variedad
   */
  static getRandomVariedResponse(emotion: EmotionType): PersonalizedResponse {
    const responses = this.EMOTION_RESPONSES[emotion] || this.EMOTION_RESPONSES[EmotionType.NEUTRAL]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  /**
   * Obtiene respuestas de transición entre emociones
   */
  static getTransitionResponse(fromEmotion: EmotionType, toEmotion: EmotionType): string {
    const transitions: { [key: string]: string } = {
      [`${EmotionType.FRUSTRATED}_${EmotionType.MOTIVATED}`]: "¡Me alegra ver cómo has transformado esa frustración en determinación! Esa es la actitud que lleva al éxito.",
      [`${EmotionType.CONFUSED}_${EmotionType.CONFIDENT}`]: "¡Increíble! De la confusión inicial has llegado a una comprensión sólida. Ese es el verdadero aprendizaje.",
      [`${EmotionType.ANXIOUS}_${EmotionType.RELIEVED}`]: "Qué alivio debe ser haber superado esa ansiedad. Has demostrado que puedes manejar los desafíos.",
      [`${EmotionType.OVERWHELMED}_${EmotionType.HOPEFUL}`]: "Es maravilloso ver cómo has pasado de sentirte abrumado a tener esperanza. Esa es una transformación poderosa.",
      [`${EmotionType.DISAPPOINTED}_${EmotionType.DETERMINED}`]: "Ver cómo conviertes la decepción en determinación es inspirador. Esa resiliencia te llevará lejos."
    }

    const key = `${fromEmotion}_${toEmotion}`
    return transitions[key] || "Me gusta ver cómo evolucionan tus emociones. Cada cambio es parte de tu crecimiento."
  }

  /**
   * Obtiene el total de respuestas disponibles
   */
  static getTotalResponseCount(): number {
    return Object.values(this.EMOTION_RESPONSES)
      .reduce((total, responses) => total + responses.length, 0)
  }

  /**
   * Obtiene estadísticas del banco de respuestas
   */
  static getResponseStats() {
    const stats = {
      totalResponses: this.getTotalResponseCount(),
      emotionCoverage: Object.keys(this.EMOTION_RESPONSES).length,
      averageResponsesPerEmotion: 0,
      toneDistribution: {} as { [tone: string]: number },
      priorityDistribution: {} as { [priority: string]: number }
    }

    stats.averageResponsesPerEmotion = Math.round(stats.totalResponses / stats.emotionCoverage)

    // Analizar distribución de tonos y prioridades
    Object.values(this.EMOTION_RESPONSES).flat().forEach(response => {
      stats.toneDistribution[response.tone] = (stats.toneDistribution[response.tone] || 0) + 1
      const priorityRange = response.priority >= 8 ? 'high' : response.priority >= 6 ? 'medium' : 'low'
      stats.priorityDistribution[priorityRange] = (stats.priorityDistribution[priorityRange] || 0) + 1
    })

    return stats
  }
}