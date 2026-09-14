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
 * @param {{ nome?: unknown, email?: unknown, papel?: unknown, foto?: unknown }} body - Dados a validar.
 * @returns {boolean} `true` quando algum campo presente possui formato inválido.
 */
function hasInvalidSubjectFields({ nome, email, papel, foto }) {
  return (
    (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) ||
    (ativa !== undefined && (typeof ativa !== 'boolean' || !ativa.trim())) || // PODE SER SÓ BOOL
    (professorId !== undefined && (typeof professorId !== 'number' || !professorId.trim()))
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

    if (
      typeof nome !== 'string' ||
      !nome.trim() ||
      typeof ativa !== 'boolean' || // PODE PRECISAR TIRAR
      !ativa.trim() ||
      typeof professorId !== 'number' ||
      !professorId.trim() ||
      hasInvalidSubjectFields({ nome, ativa, professorId})
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Nome e id do professor são obrigatórios',
      });
    }

    const result = await subjectService.createSubject({ nome, ativa, professorId });

    /*
    if (!result.ok && result.reason === 'EMAIL_CONFLICT') {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado no sistema',
      });
    }
    */ // PODE PRECISAR SER REMOVIDO!!!!!!!!!!!!!!!

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

// NO DESESPERO, DEIXAR O QUE TÁ EM BAIXO E APAGAR O DE CIMA
/*iutcfoutfvouygvbpiubpio


// CREATE - Criar nova matéria
export const create = async (req, res) => {
  try {
    const { nome, ativa, professorId } = req.body;

    if (!nome || !professorId) {
      return res.status(400).json({
        success: false,
        message: 'Nome e Identificador do professor são obrigatórios',
      });
    }

    // Cria a matéria no banco
    const novaMateria = await prisma.subject.create({
      data: {
        nome,
        ativa: ativa || true, //Default: true
        professorId,
      },
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Matéria criada com sucesso',
      data: novaMateria,
    });
  } catch (error) {
    console.error('Erro ao criar matéria:', error);

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        message: 'ID do professor inexistente',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar matéria',
    });
  }
};

// READ - Listar todas as matérias
export const getAll = async (req, res) => {
  try {
    const materias = await prisma.subject.findMany({
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Mais recentes primeiro
      },
    });

    res.status(200).json({
      success: true,
      data: materias,
      total: materias.length,
    });
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar matérias',
    });
  }
};

// READ - Buscar matéria por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Converte string para número
    const subjectId = Number(id);

    // Validação básica
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um número',
      });
    }

    const materia = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        nome: true,
        ativa: true,
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
    });

    // Matéria não encontrada
    if (!materia) {
      return res.status(404).json({
        success: false,
        message: `Matéria com ID '${subjectId}' não encontrado`,
      });
    }

    res.status(200).json({
      success: true,
      data: materia,
    });
  } catch (error) {
    console.error('Erro ao buscar matéria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar matéria',
    });
  }
};

*/