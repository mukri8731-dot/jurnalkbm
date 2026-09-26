import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db, generateUUID, UPLOAD_DIR, Journal, Attendance, JournalPhoto, Student, Teacher, SchoolClass, Subject } from './db';

export const apiRouter = Router();

// ==========================================
// 1. DATABASE STATUS & BACKUP / RESTORE
// ==========================================

apiRouter.get('/db/status', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({
    status: 'connected',
    engine: 'Persistent Local Relational Engine (ACID Disk-Synced)',
    tables: {
      users: data.users.length,
      teachers: data.teachers.length,
      schools: data.schools.length,
      classes: data.classes.length,
      subjects: data.subjects.length,
      students: data.students.length,
      journals: data.journals.length,
      attendance: data.attendance.length,
      journal_photos: data.journal_photos.length,
    },
    diskPersistent: true,
    lastUpdated: new Date().toISOString(),
  });
});

apiRouter.get('/db/backup', (req: Request, res: Response) => {
  const data = db.getData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=backup-kbm-${new Date().toISOString().slice(0, 10)}.json`);
  res.send(JSON.stringify(data, null, 2));
});

apiRouter.post('/db/restore', (req: Request, res: Response) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.journals || !backupData.teachers) {
      res.status(400).json({ error: 'Format data backup tidak valid' });
      return;
    }
    db.restore(backupData);
    res.json({ success: true, message: 'Database berhasil dipulihkan dari cadangan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memulihkan database' });
  }
});

apiRouter.post('/db/reset-seed', (req: Request, res: Response) => {
  try {
    db.resetSeed();
    res.json({ success: true, message: 'Database berhasil direset ke data contoh awal.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal reset database' });
  }
});

// ==========================================
// 2. AUTHENTICATION
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const data = db.getData();

  const user = data.users.find(
    (u) => (u.username.toLowerCase() === (username || '').toLowerCase() || u.email.toLowerCase() === (username || '').toLowerCase()) && u.password === password
  );

  if (!user) {
    res.status(401).json({ error: 'Email/Username atau password salah' });
    return;
  }

  let teacher = null;
  if (user.teacher_id) {
    teacher = data.teachers.find((t) => t.id === user.teacher_id) || null;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      teacher_id: user.teacher_id,
    },
    teacher,
    token: `token-${user.id}-${Date.now()}`,
  });
});

apiRouter.post('/auth/change-password', (req: Request, res: Response) => {
  const { user_id, current_password, new_password } = req.body;
  if (!user_id || !current_password || !new_password) {
    res.status(400).json({ error: 'Mohon isi password saat ini dan password baru.' });
    return;
  }

  if (new_password.length < 5) {
    res.status(400).json({ error: 'Password baru minimal 5 karakter.' });
    return;
  }

  const data = db.getData();
  const user = data.users.find((u) => u.id === user_id);

  if (!user) {
    res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }

  if (user.password !== current_password) {
    res.status(400).json({ error: 'Password saat ini (lama) tidak sesuai.' });
    return;
  }

  user.password = new_password;
  user.updated_at = new Date().toISOString();
  db.save();

  res.json({
    success: true,
    message: 'Password berhasil diubah. Silakan gunakan password baru pada sesi berikutnya.',
  });
});

// ==========================================
// 3. STATISTIK DASHBOARD
// ==========================================

apiRouter.get('/stats', (req: Request, res: Response) => {
  const teacherId = req.query.teacher_id as string | undefined;
  const role = req.query.role as string | undefined;

  const data = db.getData();
  let journals = data.journals;

  // If teacher role, optionally filter for their own stats or school stats
  const teacherJournals = teacherId ? journals.filter((j) => j.teacher_id === teacherId) : journals;

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  
  // Start of week (Monday)
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const mondayStr = monday.toISOString().slice(0, 10);

  // Start of month
  const firstDayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const journalsForStats = role === 'guru' && teacherId ? teacherJournals : journals;

  const totalJurnal = journalsForStats.length;
  const jurnalHariIni = journalsForStats.filter((j) => j.tanggal === todayStr).length;
  const jurnalMingguIni = journalsForStats.filter((j) => j.tanggal >= mondayStr && j.tanggal <= todayStr).length;
  const jurnalBulanIni = journalsForStats.filter((j) => j.tanggal >= firstDayMonthStr).length;

  const totalKelas = data.classes.length;
  const totalSiswa = data.students.length;
  const totalPertemuan = totalJurnal;

  // Monthly stats for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentYear = now.getFullYear();
  const monthlyData = months.map((monthName, idx) => {
    const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
    const count = journalsForStats.filter((j) => j.tanggal.startsWith(monthPrefix)).length;
    return { bulan: monthName, total: count };
  });

  // Overall attendance calculation
  const journalIds = new Set(journalsForStats.map((j) => j.id));
  const relevantAttendance = data.attendance.filter((a) => journalIds.has(a.journal_id));
  const rekapKehadiran = {
    H: relevantAttendance.filter((a) => a.status === 'H').length,
    S: relevantAttendance.filter((a) => a.status === 'S').length,
    I: relevantAttendance.filter((a) => a.status === 'I').length,
    A: relevantAttendance.filter((a) => a.status === 'A').length,
    D: relevantAttendance.filter((a) => a.status === 'D').length,
    total: relevantAttendance.length,
  };

  res.json({
    totalJurnal,
    jurnalHariIni,
    jurnalMingguIni,
    jurnalBulanIni,
    totalKelas,
    totalSiswa,
    totalPertemuan,
    monthlyData,
    rekapKehadiran,
  });
});

// ==========================================
// 4. IDENTITAS SEKOLAH
// ==========================================

apiRouter.get('/school', (req: Request, res: Response) => {
  const data = db.getData();
  const school = data.schools[0] || {};
  res.json(school);
});

apiRouter.put('/school', (req: Request, res: Response) => {
  const data = db.getData();
  const update = req.body;
  if (data.schools.length === 0) {
    data.schools.push({
      id: generateUUID(),
      ...update,
      updated_at: new Date().toISOString(),
    });
  } else {
    data.schools[0] = {
      ...data.schools[0],
      ...update,
      updated_at: new Date().toISOString(),
    };
  }
  db.save();
  res.json(data.schools[0]);
});

// ==========================================
// 5. GURU (TEACHERS)
// ==========================================

apiRouter.get('/teachers', (req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.teachers);
});

apiRouter.get('/teachers/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const teacher = data.teachers.find((t) => t.id === req.params.id);
  if (!teacher) {
    res.status(404).json({ error: 'Guru tidak ditemukan' });
    return;
  }
  res.json(teacher);
});

apiRouter.post('/teachers', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date().toISOString();
  const newTeacher: Teacher = {
    id: generateUUID(),
    nama: req.body.nama || '',
    nip: req.body.nip || '',
    email: req.body.email || '',
    telepon: req.body.telepon || '',
    mata_pelajaran: req.body.mata_pelajaran || '',
    jabatan: req.body.jabatan || 'Guru Mata Pelajaran',
    foto_url: req.body.foto_url || '',
    tanda_tangan_url: req.body.tanda_tangan_url || '',
    created_at: now,
    updated_at: now,
  };
  data.teachers.push(newTeacher);

  // If password provided, also create a user account for them
  if (req.body.password && req.body.email) {
    data.users.push({
      id: generateUUID(),
      username: req.body.email.split('@')[0],
      email: req.body.email,
      password: req.body.password,
      role: 'guru',
      teacher_id: newTeacher.id,
      created_at: now,
      updated_at: now,
    });
  }

  db.save();
  res.status(201).json(newTeacher);
});

apiRouter.put('/teachers/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const idx = data.teachers.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Guru tidak ditemukan' });
    return;
  }
  const now = new Date().toISOString();
  const { password, ...teacherFields } = req.body;
  data.teachers[idx] = {
    ...data.teachers[idx],
    ...teacherFields,
    updated_at: now,
  };

  if (password && password.trim()) {
    const user = data.users.find((u) => u.teacher_id === req.params.id);
    if (user) {
      user.password = password;
      user.updated_at = now;
    }
  }

  db.save();
  res.json(data.teachers[idx]);
});

apiRouter.delete('/teachers/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const idx = data.teachers.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Guru tidak ditemukan' });
    return;
  }
  // Check if teacher has journals
  const hasJournals = data.journals.some((j) => j.teacher_id === req.params.id);
  if (hasJournals) {
    res.status(400).json({ error: 'Guru ini memiliki catatan jurnal. Hapus atau pindahkan jurnal terlebih dahulu.' });
    return;
  }
  data.teachers.splice(idx, 1);
  data.users = data.users.filter((u) => u.teacher_id !== req.params.id);
  db.save();
  res.json({ success: true, message: 'Data guru berhasil dihapus' });
});

// ==========================================
// 6. KELAS & MATA PELAJARAN
// ==========================================

apiRouter.get('/classes', (req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.classes);
});

apiRouter.post('/classes', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date().toISOString();
  const newClass: SchoolClass = {
    id: generateUUID(),
    nama_kelas: req.body.nama_kelas,
    tingkat: req.body.tingkat || '10',
    jurusan: req.body.jurusan || 'Umum',
    wali_kelas: req.body.wali_kelas || '',
    tahun_ajaran: req.body.tahun_ajaran || '2026/2027',
    created_at: now,
    updated_at: now,
  };
  data.classes.push(newClass);
  db.save();
  res.status(201).json(newClass);
});

apiRouter.put('/classes/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const idx = data.classes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Kelas tidak ditemukan' });
    return;
  }
  data.classes[idx] = { ...data.classes[idx], ...req.body, updated_at: new Date().toISOString() };
  db.save();
  res.json(data.classes[idx]);
});

apiRouter.delete('/classes/:id', (req: Request, res: Response) => {
  const data = db.getData();
  data.classes = data.classes.filter((c) => c.id !== req.params.id);
  db.save();
  res.json({ success: true });
});

apiRouter.get('/subjects', (req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.subjects);
});

apiRouter.post('/subjects', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date().toISOString();
  const newSubj: Subject = {
    id: generateUUID(),
    kode: req.body.kode || 'MP',
    nama_mapel: req.body.nama_mapel,
    tingkat: req.body.tingkat || 'Semua',
    created_at: now,
    updated_at: now,
  };
  data.subjects.push(newSubj);
  db.save();
  res.status(201).json(newSubj);
});

apiRouter.put('/subjects/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const idx = data.subjects.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
    return;
  }
  data.subjects[idx] = { ...data.subjects[idx], ...req.body, updated_at: new Date().toISOString() };
  db.save();
  res.json(data.subjects[idx]);
});

apiRouter.delete('/subjects/:id', (req: Request, res: Response) => {
  const data = db.getData();
  data.subjects = data.subjects.filter((s) => s.id !== req.params.id);
  db.save();
  res.json({ success: true });
});

// ==========================================
// 7. SISWA (STUDENTS)
// ==========================================

apiRouter.get('/students', (req: Request, res: Response) => {
  const classId = req.query.class_id as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase();
  const data = db.getData();

  let students = data.students;
  if (classId) {
    students = students.filter((s) => s.class_id === classId);
  }
  if (search) {
    students = students.filter((s) => s.nama_siswa.toLowerCase().includes(search) || s.nis.includes(search) || s.nisn.includes(search));
  }

  // Populate class name
  const enriched = students.map((s) => {
    const cls = data.classes.find((c) => c.id === s.class_id);
    return {
      ...s,
      nama_kelas: cls ? cls.nama_kelas : '-',
    };
  });

  res.json(enriched);
});

apiRouter.post('/students', (req: Request, res: Response) => {
  const data = db.getData();
  const now = new Date().toISOString();
  const newStudent: Student = {
    id: generateUUID(),
    nis: req.body.nis || '',
    nisn: req.body.nisn || '',
    nama_siswa: req.body.nama_siswa || '',
    jenis_kelamin: req.body.jenis_kelamin || 'L',
    class_id: req.body.class_id,
    status_aktif: req.body.status_aktif !== undefined ? req.body.status_aktif : true,
    created_at: now,
    updated_at: now,
  };
  data.students.push(newStudent);
  db.save();
  res.status(201).json(newStudent);
});

apiRouter.post('/students/bulk-import', (req: Request, res: Response) => {
  const { students: importedStudents, class_id } = req.body;
  if (!Array.isArray(importedStudents)) {
    res.status(400).json({ error: 'Format data siswa tidak valid' });
    return;
  }
  const data = db.getData();
  const now = new Date().toISOString();

  let addedCount = 0;
  for (const s of importedStudents) {
    if (!s.nama_siswa) continue;
    data.students.push({
      id: generateUUID(),
      nis: s.nis || String(Math.floor(10000 + Math.random() * 90000)),
      nisn: s.nisn || '',
      nama_siswa: s.nama_siswa,
      jenis_kelamin: s.jenis_kelamin === 'P' ? 'P' : 'L',
      class_id: s.class_id || class_id || (data.classes[0]?.id || ''),
      status_aktif: true,
      created_at: now,
      updated_at: now,
    });
    addedCount++;
  }
  db.save();
  res.json({ success: true, count: addedCount, message: `Berhasil menambahkan ${addedCount} data siswa.` });
});

apiRouter.put('/students/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const idx = data.students.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Siswa tidak ditemukan' });
    return;
  }
  data.students[idx] = {
    ...data.students[idx],
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  db.save();
  res.json(data.students[idx]);
});

apiRouter.delete('/students/:id', (req: Request, res: Response) => {
  const data = db.getData();
  data.students = data.students.filter((s) => s.id !== req.params.id);
  // Also clean attendance records of this student
  data.attendance = data.attendance.filter((a) => a.student_id !== req.params.id);
  db.save();
  res.json({ success: true, message: 'Data siswa berhasil dihapus' });
});

// ==========================================
// 8. JURNAL KBM & PRESENSI & FOTO (CRUD)
// ==========================================

apiRouter.get('/journals', (req: Request, res: Response) => {
  const { teacher_id, class_id, subject_id, semester, tahun_ajaran, search, start_date, end_date } = req.query as Record<string, string>;
  const data = db.getData();

  let list = data.journals;

  if (teacher_id) list = list.filter((j) => j.teacher_id === teacher_id);
  if (class_id) list = list.filter((j) => j.class_id === class_id);
  if (subject_id) list = list.filter((j) => j.subject_id === subject_id);
  if (semester) list = list.filter((j) => j.semester === semester);
  if (tahun_ajaran) list = list.filter((j) => j.tahun_ajaran === tahun_ajaran);
  if (start_date) list = list.filter((j) => j.tanggal >= start_date);
  if (end_date) list = list.filter((j) => j.tanggal <= end_date);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((j) => j.materi.toLowerCase().includes(s) || j.kegiatan_pembelajaran.toLowerCase().includes(s) || j.catatan.toLowerCase().includes(s));
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  // Enrich with teacher, class, and subject names, and attendance stats
  const enriched = list.map((j) => {
    const teacher = data.teachers.find((t) => t.id === j.teacher_id);
    const cls = data.classes.find((c) => c.id === j.class_id);
    const subj = data.subjects.find((s) => s.id === j.subject_id);

    const attList = data.attendance.filter((a) => a.journal_id === j.id);
    const rekap = {
      H: attList.filter((a) => a.status === 'H').length,
      S: attList.filter((a) => a.status === 'S').length,
      I: attList.filter((a) => a.status === 'I').length,
      A: attList.filter((a) => a.status === 'A').length,
      D: attList.filter((a) => a.status === 'D').length,
      total: attList.length,
    };

    const photos = data.journal_photos.filter((p) => p.journal_id === j.id).sort((a, b) => a.urutan - b.urutan);

    return {
      ...j,
      nama_guru: teacher ? teacher.nama : 'Guru Tidak Dikenal',
      nip_guru: teacher ? teacher.nip : '',
      foto_guru: teacher ? teacher.foto_url : '',
      tanda_tangan_guru: teacher ? teacher.tanda_tangan_url : '',
      nama_kelas: cls ? cls.nama_kelas : 'Kelas',
      nama_mapel: subj ? subj.nama_mapel : 'Mapel',
      kode_mapel: subj ? subj.kode : '',
      rekap_kehadiran: rekap,
      jumlah_foto: photos.length,
    };
  });

  res.json(enriched);
});

apiRouter.get('/journals/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const j = data.journals.find((item) => item.id === req.params.id);
  if (!j) {
    res.status(404).json({ error: 'Jurnal KBM tidak ditemukan' });
    return;
  }

  const teacher = data.teachers.find((t) => t.id === j.teacher_id);
  const cls = data.classes.find((c) => c.id === j.class_id);
  const subj = data.subjects.find((s) => s.id === j.subject_id);
  const school = data.schools[0] || {};

  // Get attendance records enriched with student names
  const attendanceRecords = data.attendance
    .filter((a) => a.journal_id === j.id)
    .map((a) => {
      const student = data.students.find((s) => s.id === a.student_id);
      return {
        ...a,
        nama_siswa: student ? student.nama_siswa : 'Siswa',
        nis: student ? student.nis : '',
        nisn: student ? student.nisn : '',
        jenis_kelamin: student ? student.jenis_kelamin : 'L',
      };
    })
    .sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

  const rekap = {
    H: attendanceRecords.filter((a) => a.status === 'H').length,
    S: attendanceRecords.filter((a) => a.status === 'S').length,
    I: attendanceRecords.filter((a) => a.status === 'I').length,
    A: attendanceRecords.filter((a) => a.status === 'A').length,
    D: attendanceRecords.filter((a) => a.status === 'D').length,
    total: attendanceRecords.length,
  };

  const photos = data.journal_photos.filter((p) => p.journal_id === j.id).sort((a, b) => a.urutan - b.urutan);

  res.json({
    ...j,
    nama_guru: teacher ? teacher.nama : '',
    nip_guru: teacher ? teacher.nip : '',
    foto_guru: teacher ? teacher.foto_url : '',
    tanda_tangan_guru: teacher ? teacher.tanda_tangan_url : '',
    nama_kelas: cls ? cls.nama_kelas : '',
    nama_mapel: subj ? subj.nama_mapel : '',
    kode_mapel: subj ? subj.kode : '',
    school,
    attendance: attendanceRecords,
    rekap_kehadiran: rekap,
    photos,
  });
});

apiRouter.post('/journals', (req: Request, res: Response) => {
  const {
    teacher_id,
    class_id,
    subject_id,
    tanggal,
    hari,
    jam_ke,
    jam_mulai,
    jam_selesai,
    jenis_kbm,
    materi,
    tujuan_pembelajaran,
    kegiatan_pembelajaran,
    catatan,
    refleksi,
    tindak_lanjut,
    semester,
    tahun_ajaran,
    status = 'terkirim',
    foto_utama_url,
    attendance = [],
    photos = [],
  } = req.body;

  // Validation
  if (!teacher_id || !class_id || !subject_id || !tanggal || !materi) {
    res.status(400).json({ error: 'Mohon lengkapi data wajib (Guru, Kelas, Mapel, Tanggal, Materi)' });
    return;
  }

  const data = db.getData();
  const now = new Date().toISOString();
  const journalId = generateUUID();

  const newJournal: Journal = {
    id: journalId,
    teacher_id,
    class_id,
    subject_id,
    tanggal,
    hari: hari || getIndonesianDay(tanggal),
    jam_ke: jam_ke || 'Jam ke 1-2',
    jam_mulai: jam_mulai || '07:00',
    jam_selesai: jam_selesai || '08:30',
    jenis_kbm: jenis_kbm || 'Tatap Muka',
    materi,
    tujuan_pembelajaran: tujuan_pembelajaran || '',
    kegiatan_pembelajaran: kegiatan_pembelajaran || '',
    catatan: catatan || '',
    refleksi: refleksi || '',
    tindak_lanjut: tindak_lanjut || '',
    semester: semester || 'Ganjil',
    tahun_ajaran: tahun_ajaran || '2026/2027',
    status: status === 'draft' ? 'draft' : 'terkirim',
    foto_utama_url: foto_utama_url || '',
    created_at: now,
    updated_at: now,
  };

  data.journals.push(newJournal);

  // Save attendance
  if (Array.isArray(attendance)) {
    for (const att of attendance) {
      data.attendance.push({
        id: generateUUID(),
        journal_id: journalId,
        student_id: att.student_id,
        status: att.status || 'H',
        keterangan: att.keterangan || '',
        created_at: now,
        updated_at: now,
      });
    }
  }

  // Save photos
  if (Array.isArray(photos)) {
    photos.forEach((p, idx) => {
      if (p.photo_url) {
        data.journal_photos.push({
          id: generateUUID(),
          journal_id: journalId,
          photo_url: p.photo_url,
          caption: p.caption || `Dokumentasi Foto KBM Tambahan ${idx + 1}`,
          urutan: idx + 1,
          created_at: now,
        });
      }
    });
  }

  db.save();

  res.status(201).json({
    success: true,
    message: status === 'draft' ? 'Draft Jurnal KBM berhasil disimpan.' : 'Jurnal KBM berhasil disimpan.',
    journal_id: journalId,
  });
});

apiRouter.put('/journals/:id', (req: Request, res: Response) => {
  const data = db.getData();
  const jIndex = data.journals.findIndex((item) => item.id === req.params.id);
  if (jIndex === -1) {
    res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    return;
  }

  const now = new Date().toISOString();
  const { attendance, photos, ...journalFields } = req.body;

  data.journals[jIndex] = {
    ...data.journals[jIndex],
    ...journalFields,
    updated_at: now,
  };

  // Replace attendance if provided
  if (Array.isArray(attendance)) {
    data.attendance = data.attendance.filter((a) => a.journal_id !== req.params.id);
    for (const att of attendance) {
      data.attendance.push({
        id: generateUUID(),
        journal_id: req.params.id,
        student_id: att.student_id,
        status: att.status || 'H',
        keterangan: att.keterangan || '',
        created_at: now,
        updated_at: now,
      });
    }
  }

  // Replace photos if provided
  if (Array.isArray(photos)) {
    data.journal_photos = data.journal_photos.filter((p) => p.journal_id !== req.params.id);
    photos.forEach((p, idx) => {
      if (p.photo_url) {
        data.journal_photos.push({
          id: generateUUID(),
          journal_id: req.params.id,
          photo_url: p.photo_url,
          caption: p.caption || `Dokumentasi Foto KBM Tambahan ${idx + 1}`,
          urutan: idx + 1,
          created_at: now,
        });
      }
    });
  }

  db.save();
  res.json({ success: true, message: 'Jurnal KBM berhasil diperbarui.' });
});

apiRouter.delete('/journals/:id', (req: Request, res: Response) => {
  const deleted = db.deleteJournal(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    return;
  }
  res.json({ success: true, message: 'Jurnal KBM berhasil dihapus.' });
});

// ==========================================
// 9. FILE UPLOAD & DISK PERSISTENCE
// ==========================================

apiRouter.post('/upload', (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    // Strip header if data URL
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const safeName = `kbm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const targetPath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/api/uploads/${safeName}`;
    res.json({ success: true, url: publicUrl, filename: safeName });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengunggah foto' });
  }
});

// Serve uploaded files
apiRouter.use('/uploads', express.static(UPLOAD_DIR));

function getIndonesianDay(dateStr: string): string {
  if (!dateStr) return 'Senin';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Senin' : days[d.getDay()];
}
