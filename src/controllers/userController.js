// src/controllers/userController.js
import prisma from "../config/database.js";

/**
 * Controller de Usuários (Professores e Admins)
 * Responsável por gerenciar as operações CRUD de usuários
 */

// CREATE - Criar novo usuário
export const create = async (req, res) => {
  try {
    const { nome, email, papel, foto } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: "Nome e email são obrigatórios",
      });
    }

    // Verifica se email já existe
    const emailExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExistente) {
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado no sistema",
      });
    }

    // Cria o usuário no banco
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        papel: papel || "PROFESSOR", // Default: PROFESSOR
        foto: foto || null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        foto: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: novoUsuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado no sistema",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao criar usuário",
    });
  }
};

// READ - Listar todos os usuários
export const getAll = async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        foto: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc", // Mais recentes primeiro
      },
    });

    res.status(200).json({
      success: true,
      data: usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar usuários",
    });
  }
};

// READ - Buscar usuário por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Converte string para número
    const userId = Number(id);

    // Validação básica
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID inválido. Deve ser um número",
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        foto: true,
        createdAt: true,
      },
    });

    // Usuário não encontrado
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: `Usuário com ID${userId} não encontrado`,
      });
    }

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuário",
    });
  }
};