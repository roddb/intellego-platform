'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Calendar, Book, Shield, Settings, Camera, Save, X, Edit2 } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  studentId?: string
  program?: string
  academicYear?: string
  enrollmentYear?: number
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  image?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReminders: boolean
    progressReports: boolean
  }
}

interface StudentProfileProps {
  userId: string
}

export default function StudentProfile({ userId }: StudentProfileProps) {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'preferences' | 'security'>('personal')
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setTempProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setTempProfile({ ...profile! })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setTempProfile({ ...profile! })
    setIsEditing(false)
  }

  const saveProfile = async () => {
    if (!tempProfile) return

    try {
      setSaving(true)
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempProfile),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
        
        // Update session if name or email changed
        if (updatedProfile.name !== session?.user?.name || updatedProfile.email !== session?.user?.email) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              name: updatedProfile.name,
              email: updatedProfile.email,
            }
          })
        }
      } else {
        throw new Error('Error saving profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar el perfil. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const updateTempProfile = (field: string, value: any) => {
    setTempProfile(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setTempProfile(prev => ({
      ...prev!,
      [parent]: {
        ...prev![parent as keyof UserProfile] as any,
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No se pudo cargar el perfil</p>
      </div>
    )
  }

  const currentProfile = isEditing ? tempProfile! : profile

  return (
    <div className="space-y-6">
      {/* Header with Avatar and Basic Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold">
                {currentProfile.image ? (
                  <img 
                    src={currentProfile.image} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  currentProfile.name?.charAt(0).toUpperCase()
                )}
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{currentProfile.name}</h1>
              <p className="text-slate-600">{currentProfile.email}</p>
              {currentProfile.studentId && (
                <p className="text-sm text-slate-500">ID: {currentProfile.studentId}</p>
              )}
              <div className="flex items-center mt-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentProfile.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentProfile.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'personal', label: 'Información Personal', icon: User },
              { id: 'academic', label: 'Información Académica', icon: Book },
              { id: 'preferences', label: 'Preferencias', icon: Settings },
              { id: 'security', label: 'Seguridad', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre Completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentProfile.name}
                      onChange={(e) => updateTempProfile('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={currentProfile.email}
                      onChange={(e) => updateTempProfile('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={currentProfile.phoneNumber || ''}
                      onChange={(e) => updateTempProfile('phoneNumber', e.target.value)}
                      placeholder="Ej: +1234567890"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.phoneNumber || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={currentProfile.dateOfBirth || ''}
                      onChange={(e) => updateTempProfile('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">
                      {currentProfile.dateOfBirth 
                        ? new Date(currentProfile.dateOfBirth).toLocaleDateString() 
                        : 'No especificado'
                      }
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                {isEditing ? (
                  <textarea
                    value={currentProfile.address || ''}
                    onChange={(e) => updateTempProfile('address', e.target.value)}
                    placeholder="Dirección completa"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                ) : (
                  <p className="text-slate-900">{currentProfile.address || 'No especificado'}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentProfile.emergencyContact?.name || ''}
                        onChange={(e) => updateNestedField('emergencyContact', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    ) : (
                      <p className="text-slate-900">{currentProfile.emergencyContact?.name || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={currentProfile.emergencyContact?.phone || ''}
                        onChange={(e) => updateNestedField('emergencyContact', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    ) : (
                      <p className="text-slate-900">{currentProfile.emergencyContact?.phone || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Relación
                    </label>
                    {isEditing ? (
                      <select
                        value={currentProfile.emergencyContact?.relationship || ''}
                        onChange={(e) => updateNestedField('emergencyContact', 'relationship', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="padre">Padre</option>
                        <option value="madre">Madre</option>
                        <option value="hermano">Hermano/a</option>
                        <option value="conyuge">Cónyuge</option>
                        <option value="amigo">Amigo/a</option>
                        <option value="otro">Otro</option>
                      </select>
                    ) : (
                      <p className="text-slate-900">{currentProfile.emergencyContact?.relationship || 'No especificado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ID de Estudiante
                  </label>
                  <p className="text-slate-900 font-mono">{currentProfile.studentId || 'No asignado'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado Académico
                  </label>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    currentProfile.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentProfile.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Programa de Estudios
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentProfile.program || ''}
                      onChange={(e) => updateTempProfile('program', e.target.value)}
                      placeholder="Ej: Ingeniería en Sistemas"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.program || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Año Académico
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentProfile.academicYear || ''}
                      onChange={(e) => updateTempProfile('academicYear', e.target.value)}
                      placeholder="Ej: 2024-2025"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.academicYear || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Año de Ingreso
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentProfile.enrollmentYear || ''}
                      onChange={(e) => updateTempProfile('enrollmentYear', parseInt(e.target.value) || undefined)}
                      placeholder="Ej: 2023"
                      min="2000"
                      max="2030"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-slate-900">{currentProfile.enrollmentYear || 'No especificado'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Notificaciones</h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Notificaciones por Email', description: 'Recibir emails sobre actualizaciones importantes' },
                    { key: 'pushNotifications', label: 'Notificaciones Push', description: 'Recibir notificaciones en el navegador' },
                    { key: 'weeklyReminders', label: 'Recordatorios Semanales', description: 'Recordatorios para enviar reportes semanales' },
                    { key: 'progressReports', label: 'Reportes de Progreso', description: 'Recibir resúmenes mensuales de progreso' },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{pref.label}</p>
                        <p className="text-sm text-slate-600">{pref.description}</p>
                      </div>
                      {isEditing ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentProfile.preferences?.[pref.key as keyof typeof currentProfile.preferences] || false}
                            onChange={(e) => updateNestedField('preferences', pref.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                      ) : (
                        <div className={`w-11 h-6 rounded-full ${
                          currentProfile.preferences?.[pref.key as keyof typeof currentProfile.preferences] 
                            ? 'bg-teal-600' 
                            : 'bg-slate-200'
                        } flex items-center transition-colors`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            currentProfile.preferences?.[pref.key as keyof typeof currentProfile.preferences] 
                              ? 'translate-x-5' 
                              : 'translate-x-0'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Cambiar Contraseña</h3>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Cambiar Contraseña
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Sesiones Activas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Sesión Actual</p>
                      <p className="text-sm text-slate-600">Mac OS - Chrome</p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Activa</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}