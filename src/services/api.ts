import {
  User,
  Teacher,
  School,
  SchoolClass,
  Subject,
  Student,
  Journal,
  DashboardStats,
  DatabaseStatus,
} from '../types';

export const API_BASE = '/api';

export const api = {
  // Database status & backup
  async getDbStatus(): Promise<DatabaseStatus> {
    const res = await fetch(`${API_BASE}/db/status`);
    if (!res.ok) throw new Error('Gagal memeriksa status database');
    return res.json();
  },

  async resetSeed(): Promise<void> {
    const res = await fetch(`${API_BASE}/db/reset-seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Gagal reset database');
  },

  async restoreDatabase(data: any): Promise<void> {
    const res = await fetch(`${API_BASE}/db/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memulihkan database');
    }
  },

  // Auth
  async login(username: string, password: string): Promise<{ user: User; teacher: Teacher | null; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login gagal');
    }
    return res.json();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah password');
    }
    return res.json();
  },

  // Stats
  async getStats(teacherId?: string, role?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacher_id', teacherId);
    if (role) params.append('role', role);
    const res = await fetch(`${API_BASE}/stats?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat statistik');
    return res.json();
  },

  // School
  async getSchool(): Promise<School> {
    const res = await fetch(`${API_BASE}/school`);
    if (!res.ok) throw new Error('Gagal memuat profil sekolah');
    return res.json();
  },

  async updateSchool(data: Partial<School>): Promise<School> {
    const res = await fetch(`${API_BASE}/school`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui profil sekolah');
    return res.json();
  },

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    const res = await fetch(`${API_BASE}/teachers`);
    if (!res.ok) throw new Error('Gagal memuat data guru');
    return res.json();
  },

  async getTeacher(id: string): Promise<Teacher> {
    const res = await fetch(`${API_BASE}/teachers/${id}`);
    if (!res.ok) throw new Error('Guru tidak ditemukan');
    return res.json();
  },

  async createTeacher(data: Partial<Teacher> & { password?: string }): Promise<Teacher> {
    const res = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambah guru');
    }
    return res.json();
  },

  async updateTeacher(id: string, data: Partial<Teacher> & { password?: string }): Promise<Teacher> {
    const res = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui guru');
    return res.json();
  },

  async deleteTeacher(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/teachers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus guru');
    }
  },

  // Classes
  async getClasses(): Promise<SchoolClass[]> {
    const res = await fetch(`${API_BASE}/classes`);
    if (!res.ok) throw new Error('Gagal memuat kelas');
    return res.json();
  },

  async createClass(data: Partial<SchoolClass>): Promise<SchoolClass> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateClass(id: string, data: Partial<SchoolClass>): Promise<SchoolClass> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteClass(id: string): Promise<void> {
    await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' });
  },

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE}/subjects`);
    if (!res.ok) throw new Error('Gagal memuat mata pelajaran');
    return res.json();
  },

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const res = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteSubject(id: string): Promise<void> {
    await fetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
  },

  // Students
  async getStudents(classId?: string, search?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat data siswa');
    return res.json();
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async bulkImportStudents(students: Partial<Student>[], class_id?: string): Promise<{ count: number; message: string }> {
    const res = await fetch(`${API_BASE}/students/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students, class_id }),
    });
    return res.json();
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteStudent(id: string): Promise<void> {
    await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
  },

  // Journals
  async getJournals(filters?: {
    teacher_id?: string;
    class_id?: string;
    subject_id?: string;
    semester?: string;
    tahun_ajaran?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Journal[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/journals?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat jurnal');
    return res.json();
  },

  async getJournalById(id: string): Promise<Journal> {
    const res = await fetch(`${API_BASE}/journals/${id}`);
    if (!res.ok) throw new Error('Jurnal tidak ditemukan');
    return res.json();
  },

  async saveJournal(data: any): Promise<{ success: boolean; message: string; journal_id?: string }> {
    const isEdit = !!data.id;
    const url = isEdit ? `${API_BASE}/journals/${data.id}` : `${API_BASE}/journals`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan jurnal');
    }
    return res.json();
  },

  async deleteJournal(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/journals/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus jurnal');
    }
  },

  // Upload image
  async uploadImage(imageBase64: string): Promise<{ url: string; filename: string }> {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) throw new Error('Gagal mengunggah foto');
    return res.json();
  },
};
