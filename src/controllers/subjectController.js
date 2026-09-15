import * as subjectService from '../services/subjectService.js';

const allowedPatchFields = ['nome', 'ativa', 'professorId'];

/**
 * Converte um valor de rota em um ID inteiro positivo, sem aceitar valores parciais.
 * @param {unknown} value - Valor recebido em `req.params.id`.
 * @returns {number|null} ID válido ou `null` quando o valor é inválido.
 */
function toPositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * Verifica se o corpo de um PATCH contém pelo menos um campo que pode ser atualizado.
 * @param {Object} body - Corpo recebido na requisição.
 * @returns {boolean} `true` quando há ao menos um campo permitido.
 */
function hasAllowedPatchField(body) {
  return allowedPatchFields.some(field => Object.hasOwn(body, field));
}

/**
 * Identifica valores inválidos nos campos que o usuário pode enviar.
 * @param {{ nome?: unknown, ativa?: unknown, professorId?: unknown }} body - Dados a validar.
 * @returns {boolean} `true` quando algum campo presente possui formato inválido.
 */
function hasInvalidSubjectFields({ nome, ativa, professorId }) {
  return (
    (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) ||
    (ativa !== undefined && typeof ativa !== 'boolean') ||
    (professorId !== undefined && !toPositiveInt(professorId))
  );
}

/**
 * Valida a criação de uma matéria, delega a persistência ao service e monta a resposta HTTP.
 * @param {Object} req - Requisição Express com os dados da matéria.
 * @param {Object} res - Resposta Express usada para enviar o status e o JSON.
 * @returns {Promise<Object>} Resposta HTTP de criação, validação ou erro.
 */
export const create = async (req, res) => {
  try {
    const { nome, ativa, professorId } = req.body;
    const professorIdInt = toPositiveInt(professorId);

    if (
      typeof nome !== 'string' ||
      !nome.trim() ||
      !professorIdInt ||
      hasInvalidSubjectFields({ nome, ativa, professorId })
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nome e professorId (inteiro positivo) são obrigatórios; ativa deve ser booleana',
      });
    }

    const result = await subjectService.createSubject({
      nome,
      ativa,
      professorId: professorIdInt,
    });

    if (!result.ok && result.reason === 'PROFESSOR_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Professor informado não existe',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Matéria criada com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao criar matéria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar matéria',
    });
  }
};

/**
 * Lista as matérias retornadas pelo service e informa o total encontrado.
 * @param {Object} _req - Requisição Express, não utilizada nesta operação.
 * @param {Object} res - Resposta Express usada para enviar a listagem.
 * @returns {Promise<Object>} Resposta HTTP com a lista ou um erro interno.
 */
export const getAll = async (_req, res) => {
  try {
    const materias = await subjectService.getAllSubjects();

    return res.status(200).json({
      success: true,
      data: materias,
      total: materias.length,
    });
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar matérias',
    });
  }
};

/**
 * Valida o ID da rota e devolve uma matéria específica quando ela existe.
 * @param {Object} req - Requisição Express que contém `params.id`.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP com a matéria, erro de validação ou ausência.
 */
export const getById = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    const materia = await subjectService.getSubjectById(subjectId);

    if (!materia) {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    return res.status(200).json({
      success: true,
      data: materia,
    });
  } catch (error) {
    console.error('Erro ao buscar matéria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar matéria',
    });
  }
};

/**
 * Valida um PATCH parcial e solicita ao service a atualização da matéria.
 * @param {Object} req - Requisição Express com o ID e os campos a atualizar.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP de atualização, validação ou ausência.
 */
export const update = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    if (!hasAllowedPatchField(req.body) || hasInvalidSubjectFields(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Envie ao menos um campo válido: nome, ativa ou professorId',
      });
    }

    const patchData = { ...req.body };
    if (Object.hasOwn(patchData, 'professorId')) {
      patchData.professorId = toPositiveInt(patchData.professorId);
    }

    const result = await subjectService.updateSubject(subjectId, patchData);

    if (!result.ok && result.reason === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    if (!result.ok && result.reason === 'PROFESSOR_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Professor informado não existe',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Matéria atualizada com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar matéria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar matéria',
    });
  }
};

/**
 * Remove uma matéria quando o ID é válido e não existem questões vinculadas.
 * @param {Object} req - Requisição Express que contém `params.id`.
 * @param {Object} res - Resposta Express usada para enviar o resultado.
 * @returns {Promise<Object>} Resposta HTTP de remoção, conflito, validação ou ausência.
 */
export const remove = async (req, res) => {
  try {
    const subjectId = toPositiveInt(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número inteiro positivo',
      });
    }

    const result = await subjectService.deleteSubject(subjectId);

    if (!result.ok && result.reason === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID ${subjectId} não encontrada`,
      });
    }

    if (!result.ok && result.reason === 'SUBJECT_IN_USE') {
      return res.status(409).json({
        success: false,
        message: 'Matéria possui questões vinculadas',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Matéria removida com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao remover matéria:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover matéria',
    });
  }
};