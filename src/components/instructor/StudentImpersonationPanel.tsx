"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, X, Search, Loader2 } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  sede?: string
  academicYear?: string
  division?: string
  label: string
}

export default function StudentImpersonationPanel() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [isImpersonating, setIsImpersonating] = useState(false)

  // Fetch students list on mount
  useEffect(() => {
    fetchStudents()
  }, [])

  // Filter students based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/instructor/students')
      const data = await response.json()
      if (data.success) {
        setStudents(data.students)
        setFilteredStudents(data.students)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const startImpersonation = async () => {
    if (!selectedStudent) return

    setLoading(true)
    try {
      const response = await fetch('/api/instructor/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent })
      })

      const data = await response.json()

      if (data.success) {
        // Update the session with impersonation data
        await update({
          impersonating: data.impersonationData
        })

        setIsImpersonating(true)

        // Redirect to student dashboard
        router.push('/dashboard/student')
      } else {
        alert(data.error || 'Failed to start impersonation')
      }
    } catch (error) {
      console.error('Error starting impersonation:', error)
      alert('Failed to start impersonation')
    } finally {
      setLoading(false)
    }
  }

  const endImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/instructor/impersonate', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Clear impersonation from session
        await update({
          impersonating: null
        })

        setIsImpersonating(false)
        setSelectedStudent('')

        // Redirect back to instructor dashboard
        router.push('/dashboard/instructor')
      }
    } catch (error) {
      console.error('Error ending impersonation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if currently impersonating
  useEffect(() => {
    if (session?.user?.isImpersonating) {
      setIsImpersonating(true)
    }
  }, [session])

  if (isImpersonating && session?.user?.impersonating) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                Modo Vista Activo
              </p>
              <p className="text-sm text-yellow-700">
                Viendo como: {session.user.impersonating.studentName} ({session.user.impersonating.studentId})
              </p>
            </div>
          </div>
          <button
            onClick={endImpersonation}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span>Salir del Modo Vista</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <Eye className="h-5 w-5 mr-2 text-blue-600" />
          Ver como Estudiante
        </h3>
        <p className="text-sm text-gray-600">
          Visualiza el dashboard exactamente como lo ve un estudiante específico
        </p>
      </div>

      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Student selector */}
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          size={5}
        >
          <option value="">Seleccionar estudiante...</option>
          {filteredStudents.map((student) => (
            <option key={student.id} value={student.studentId}>
              {student.label}
            </option>
          ))}
        </select>

        {/* Action button */}
        <button
          onClick={startImpersonation}
          disabled={!selectedStudent || loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            selectedStudent && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Iniciando...</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>Ver como Estudiante</span>
            </>
          )}
        </button>

        {/* Warning message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Nota:</strong> Esta función es solo para soporte y diagnóstico.
            Todas las acciones quedan registradas para auditoría.
            El modo vista expira automáticamente después de 30 minutos.
          </p>
        </div>
      </div>
    </div>
  )
}