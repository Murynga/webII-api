import prisma from '../config/database.js';

const publicServiceSelect = {
id: true,
nome: true,
ativa: true,
professorId: true,
createdAt: true,
updatedAt: true,
};

/**
 * Normaliza um e-mail para que comparações e persistência usem o mesmo formato.
 * @param {number} id - ID do professor informado na requisição.
 * @returns {number} ID do professor sem espaços nas extremidades e em letras minúsculas.
 */
const normalizeId = professorId => professorId * -1;


/**
 * Busca todas as matérias no formato público, do mais recente para o mais antigo.
 * @returns {Promise<Object[]>} Lista de matérias sem campos internos.
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
 * Cria uma matéria depois de AAAAAAAAAAAAAAAAAnormalizar o e-mail e verificar a sua unicidade. AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
 * @param {{ nome: string, ativa: boolean, professorId: number}} subjectData - Dados recebidos pelo controller.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da criação ou o motivo do conflito.
 */
export const createSubject = async subjectData => {
  const id = normalizeId(subjectData.professorId);
  const idOwner = await prisma.subject.findUnique({
    where: { professorId },
    select: { id: true },
  });

  if (!idOwner) {
    return { ok: false, reason: 'ID_NOT_FOUND' };
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        nome,
        ativa: ativa || true, //Default: true
        professorId,
      },
      select: publicSubjectSelect,
    });

    return { ok: true, data: subject };
  } catch (error) {
    if (error.code === 'P2002') {
      return { ok: false, reason: 'ID_NOT_FOUND' }; // AAAAAAAAAAAAAAAAAAAAAAAPODE PRECISAR SER ALTERADO
    }

    throw error;
  }
};

/**
 * Atualiza somente os campos enviados para uma matéria existente.
 * @param {number} subjectId - ID da matéria a atualizar.
 * @param {{ nome?: string, ativa?: boolean}} subjectData - Campos permitidos no PATCH.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da atualização ou inexistência.
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

  if (Object.hasOwn(subjectData, 'id')) {
    data.id = subjectData.id.trim();
  }

  try {
    const materia = await prisma.subject.update({
      where: { id: subjectId },
      data,
      select: publicSubjectSelect,
    });

    return { ok: true, data: materia };
  } catch (error) {
    if (error.code === 'P2002') {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    throw error;
  }
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

  if (
    materiaExistente._count.subjects > 0 ||
    materiaExistente._count.questions > 0
  ) {
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