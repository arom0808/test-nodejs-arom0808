#!/bin/bash
set -e

#psql -v ON_ERROR_STOP=1 --host "$POSTGRES_HOST" --port "$POSTGRES_PORT" --username "$POSTGRES_USERNAME" --dbname "$POSTGRES_DATABASE" --no-password <<-EOSQL
psql -v ON_ERROR_STOP=1 "$POSTGRES_CONN" <<-EOSQL

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(60) NOT NULL,
    "countryId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "phone" VARCHAR(20),
    "image" VARCHAR(200),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "aId" INTEGER NOT NULL,
    "bId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("aId","bId")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "tags" VARCHAR(20)[],
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JWTToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresIn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JWTToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserDislikedPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_UserLikedPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "_UserDislikedPosts_AB_unique" ON "_UserDislikedPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_UserDislikedPosts_B_index" ON "_UserDislikedPosts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserLikedPosts_AB_unique" ON "_UserLikedPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_UserLikedPosts_B_index" ON "_UserLikedPosts"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_aId_fkey" FOREIGN KEY ("aId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_bId_fkey" FOREIGN KEY ("bId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JWTToken" ADD CONSTRAINT "JWTToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDislikedPosts" ADD CONSTRAINT "_UserDislikedPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDislikedPosts" ADD CONSTRAINT "_UserDislikedPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserLikedPosts" ADD CONSTRAINT "_UserLikedPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserLikedPosts" ADD CONSTRAINT "_UserLikedPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


EOSQL