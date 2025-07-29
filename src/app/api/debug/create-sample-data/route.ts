import { NextResponse } from "next/server"
import { addWeeklyReport, getCurrentWeekStart, getCurrentWeekEnd } from "@/lib/temp-storage"

export async function POST() {
  try {
    // Create a sample weekly report for Alumno 1
    const weekStart = getCurrentWeekStart()
    const weekEnd = getCurrentWeekEnd()

    const sampleReport = {
      id: Date.now().toString(),
      userId: "1750822849942", // ID of Alumno 1 that was just created
      weekStart,
      weekEnd,
      submittedAt: new Date(),
      responses: {
        temasYDominio: "Esta semana trabajamos con JavaScript básico - Nivel 2: Puedo crear funciones simples y manejar arrays básicos, pero aún me cuesta con objetos complejos.",
        evidenciaAprendizaje: "Resolví un ejercicio de ordenamiento de arrays. El problema era ordenar una lista de estudiantes por nota. Usé el método sort() y logré implementarlo correctamente.",
        dificultadesEstrategias: "Me resultó difícil entender los closures en JavaScript. Para superarlo, practiqué con ejemplos simples y busqué tutoriales en YouTube.",
        conexionesAplicacion: "Los arrays se conectan con lo que vimos de bases de datos porque son como tablas. Podría aplicarlo para crear un sistema de inventario para una tienda.",
        comentariosAdicionales: "Me gustó mucho la clase de esta semana. Espero poder seguir practicando con más ejercicios."
      }
    }

    addWeeklyReport(sampleReport)

    return NextResponse.json({
      message: "Datos de muestra creados exitosamente",
      report: sampleReport
    })

  } catch (error) {
    console.error("Error creating sample data:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}