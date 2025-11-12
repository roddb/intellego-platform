'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
  sede?: string;
  academicYear?: string;
  division?: string;
  subjects?: string;
  status: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  onSuccess,
}: UserManagementModalProps) {
  // Add User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
    sede: '',
    academicYear: '',
    division: '',
    subjects: [] as string[],
  });

  const [subjectInput, setSubjectInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Delete User State
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch users when switching to delete tab
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/instructor/students');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectInput.trim()],
      });
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== subject),
    });
  };

  const handleSubmitAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/instructor/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          text: `Usuario ${data.user.name} creado exitosamente`,
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'STUDENT',
          sede: '',
          academicYear: '',
          division: '',
          subjects: [],
        });

        // Refresh users list
        fetchUsers();

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'Error al crear usuario',
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'Error de conexión al crear usuario',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserToDelete || deleteConfirmation !== selectedUserToDelete.email) {
      setDeleteMessage({
        type: 'error',
        text: 'Confirmación incorrecta. Escribe el email del usuario.',
      });
      return;
    }

    setIsDeleting(true);
    setDeleteMessage(null);

    try {
      const response = await fetch('/api/instructor/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUserToDelete.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteMessage({
          type: 'success',
          text: `Usuario ${data.deletedUser.name} eliminado exitosamente`,
        });

        // Reset delete state
        setSelectedUserToDelete(null);
        setDeleteConfirmation('');

        // Refresh users list
        fetchUsers();

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setDeleteMessage({
          type: 'error',
          text: data.error || 'Error al eliminar usuario',
        });
      }
    } catch (error) {
      setDeleteMessage({
        type: 'error',
        text: 'Error de conexión al eliminar usuario',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    Gestión de Usuarios
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                        ${
                          selected
                            ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <UserPlusIcon className="h-5 w-5" />
                        Agregar Usuario
                      </div>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
                        ${
                          selected
                            ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
                        }`
                      }
                    >
                      <div className="flex items-center justify-center gap-2">
                        <TrashIcon className="h-5 w-5" />
                        Eliminar Usuario
                      </div>
                    </Tab>
                  </Tab.List>

                  <Tab.Panels>
                    {/* Add User Panel */}
                    <Tab.Panel>
                      <form onSubmit={handleSubmitAddUser} className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nombre completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Contraseña *
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Rol *
                            </label>
                            <select
                              required
                              value={formData.role}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  role: e.target.value as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            >
                              <option value="STUDENT">Estudiante</option>
                              <option value="INSTRUCTOR">Instructor</option>
                              <option value="ADMIN">Administrador</option>
                            </select>
                          </div>
                        </div>

                        {/* Student-specific fields */}
                        {formData.role === 'STUDENT' && (
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Información del Estudiante
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              El ID del estudiante se generará automáticamente al crear el usuario.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Sede
                                </label>
                                <input
                                  type="text"
                                  value={formData.sede}
                                  onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                  placeholder="Ej: Colegiales"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Año Académico
                                </label>
                                <input
                                  type="text"
                                  value={formData.academicYear}
                                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                  placeholder="Ej: 5to Año"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  División
                                </label>
                                <input
                                  type="text"
                                  value={formData.division}
                                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                  placeholder="Ej: A"
                                />
                              </div>
                            </div>

                            {/* Subjects */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Materias
                              </label>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={subjectInput}
                                  onChange={(e) => setSubjectInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubject();
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                  placeholder="Ej: Matemática"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddSubject}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Agregar
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.subjects.map((subject) => (
                                  <span
                                    key={subject}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                                  >
                                    {subject}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubject(subject)}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit Message */}
                        {submitMessage && (
                          <div
                            className={`p-3 rounded-md ${
                              submitMessage.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {submitMessage.text}
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                          </button>
                        </div>
                      </form>
                    </Tab.Panel>

                    {/* Delete User Panel */}
                    <Tab.Panel>
                      <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre, email o ID..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Users List */}
                        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                          {isLoadingUsers ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                              Cargando usuarios...
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                              No se encontraron usuarios
                            </div>
                          ) : (
                            filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                                  selectedUserToDelete?.id === user.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                }`}
                                onClick={() => setSelectedUserToDelete(user)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {user.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {user.email}
                                    </p>
                                    {user.studentId && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        ID: {user.studentId}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      user.role === 'ADMIN'
                                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                        : user.role === 'INSTRUCTOR'
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Delete Confirmation */}
                        {selectedUserToDelete && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                              ⚠️ Confirmar Eliminación
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                              Estás a punto de eliminar a{' '}
                              <strong>{selectedUserToDelete.name}</strong>. Esta acción NO se
                              puede deshacer y eliminará todos los reportes y evaluaciones
                              asociados.
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                              Para confirmar, escribe el email del usuario:{' '}
                              <strong>{selectedUserToDelete.email}</strong>
                            </p>
                            <input
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="Escribe el email aquí"
                              className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md dark:bg-gray-700 dark:text-white mb-3"
                            />
                            {deleteMessage && (
                              <div
                                className={`p-2 rounded-md mb-3 ${
                                  deleteMessage.type === 'success'
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                }`}
                              >
                                {deleteMessage.text}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserToDelete(null);
                                  setDeleteConfirmation('');
                                  setDeleteMessage(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleDeleteUser}
                                disabled={
                                  isDeleting || deleteConfirmation !== selectedUserToDelete.email
                                }
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
