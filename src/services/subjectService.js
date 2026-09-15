import prisma from '../config/database.js';

const publicSubjectSelect = {
  id: true,
  nome: true,
  ativa: true,
  professorId: true,
  createdAt: true,
  updatedAt: true,
  professor: {
    select: {
      id: true,
      nome: true,
      email: true,
      foto: true,
    },
  },
};

/**
 * Busca todas as matérias no formato público, da mais recente para a mais antiga.
 * @returns {Promise<Object[]>} Lista de matérias.
 */
export const getAllSubjects = async () => {
  return prisma.subject.findMany({
    select: publicSubjectSelect,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Busca uma matéria pelo identificador único.
 * @param {number} subjectId - ID da matéria.
 * @returns {Promise<Object|null>} Matéria encontrada ou `null` quando ela não existe.
 */
export const getSubjectById = async subjectId => {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    select: publicSubjectSelect,
  });
};

/**
 * Cria uma matéria depois de verificar se o professor informado existe.
 * @param {{ nome: string, ativa?: boolean, professorId: number }} subjectData - Dados recebidos pelo controller.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da criação ou o motivo da falha.
 */
export const createSubject = async subjectData => {
  const professor = await prisma.user.findUnique({
    where: { id: subjectData.professorId },
    select: { id: true },
  });

  if (!professor) {
    return { ok: false, reason: 'PROFESSOR_NOT_FOUND' };
  }

  const materia = await prisma.subject.create({
    data: {
      nome: subjectData.nome.trim(),
      ativa: subjectData.ativa ?? true,
      professorId: subjectData.professorId,
    },
    select: publicSubjectSelect,
  });

  return { ok: true, data: materia };
};

/**
 * Atualiza somente os campos enviados para uma matéria existente.
 * @param {number} subjectId - ID da matéria a atualizar.
 * @param {{ nome?: string, ativa?: boolean, professorId?: number }} subjectData - Campos permitidos no PATCH.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da atualização ou o motivo da falha.
 */
export const updateSubject = async (subjectId, subjectData) => {
  const materiaExistente = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!materiaExistente) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const data = {};

  if (Object.hasOwn(subjectData, 'nome')) {
    data.nome = subjectData.nome.trim();
  }

  if (Object.hasOwn(subjectData, 'ativa')) {
    data.ativa = subjectData.ativa;
  }

  if (Object.hasOwn(subjectData, 'professorId')) {
    const professor = await prisma.user.findUnique({
      where: { id: subjectData.professorId },
      select: { id: true },
    });

    if (!professor) {
      return { ok: false, reason: 'PROFESSOR_NOT_FOUND' };
    }

    data.professorId = subjectData.professorId;
  }

  const materia = await prisma.subject.update({
    where: { id: subjectId },
    data,
    select: publicSubjectSelect,
  });

  return { ok: true, data: materia };
};

/**
 * Remove uma matéria que não possua questões vinculadas.
 * @param {number} subjectId - ID da matéria a remover.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Matéria removida ou o motivo que impede a remoção.
 */
export const deleteSubject = async subjectId => {
  const materiaExistente = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      ...publicSubjectSelect,
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!materiaExistente) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  if (materiaExistente._count.questions > 0) {
    return { ok: false, reason: 'SUBJECT_IN_USE' };
  }

  try {
    const materia = await prisma.subject.delete({
      where: { id: subjectId },
      select: publicSubjectSelect,
    });

    return { ok: true, data: materia };
  } catch (error) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      return { ok: false, reason: 'SUBJECT_IN_USE' };
    }

    throw error;
  }
};