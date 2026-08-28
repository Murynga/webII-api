/*
  Warnings:

  - You are about to drop the column `autor_id` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `disciplina_id` on the `Question` table. All the data in the column will be lost.
  - Added the required column `author_id` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_autor_id_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_disciplina_id_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "autor_id",
DROP COLUMN "disciplina_id",
ADD COLUMN     "author_id" INTEGER NOT NULL,
ADD COLUMN     "subject_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
