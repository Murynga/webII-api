//src/app.js
import express from 'express';
import prisma from './config/database.js';

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      message: 'API do Gerador de Provas',
      timestamp: new Date().toISOString(),
      services: {
        api: 'OK',
        database: { status: 'OK' },
      },
    });
  } catch (error) {
    console.error('Erro na verificação do banco:', error);

    res.status(503).json({
      status: 'DEGRADED',
      message: 'API do Gerador de Provas',
      services: {
        api: 'OK',
        database: { status: 'ERROR' },
      },
    });
  }
});

app.get('/users', async (req, res) => {
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
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário(s):', error);

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário(s)',
    });
  }
});

app.get('/subjects', async (req, res) => {
  try {
    const disciplinas = await prisma.subject.findMany({
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
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: disciplinas,
      total: disciplinas.length,
    });
  } catch (error) {
    console.error('Erro ao buscar disciplina(s):', error);

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar disciplina(s)',
    });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const questoes = await prisma.question.findMany({
      select: {
        id: true,
        enunciado: true,
        dificuldade: true,
        resposta_correta: true,
        ativa: true,
        subject: {
          select: {
            id: true,
            nome: true,
            ativa: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto: true,
          },
        },
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: questoes,
      total: questoes.length,
    });
  } catch (error) {
    console.error('Erro ao buscar questão(ões):', error);

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar questão(ões)',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota ' + req.method + ' ' + req.originalUrl + ' não encontrada',
  });
});

export default app;
