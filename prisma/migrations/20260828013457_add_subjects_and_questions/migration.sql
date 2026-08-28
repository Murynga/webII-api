-- CreateEnum
CREATE TYPE "Dificuldade" AS ENUM ('1', '2', '3');

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "professor_id" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "dificuldade" "Dificuldade" NOT NULL,
    "resposta_correta" TEXT,
    "disciplina_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
