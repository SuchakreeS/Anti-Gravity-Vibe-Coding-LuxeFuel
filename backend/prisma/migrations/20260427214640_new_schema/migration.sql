/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `car` ADD COLUMN `lastServiceMileage` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `serviceInterval` DOUBLE NOT NULL DEFAULT 10000;

-- AlterTable
ALTER TABLE `organization` ADD COLUMN `plan` ENUM('FREE', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN', 'DRIVER', 'USER', 'INDIVIDUAL') NOT NULL DEFAULT 'INDIVIDUAL';
