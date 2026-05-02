-- AlterTable
ALTER TABLE `car` ADD COLUMN `maintenanceData` TEXT NULL,
    ADD COLUMN `tankSize` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `fuelrecord` ADD COLUMN `fuelLevel` DOUBLE NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `plan` ENUM('FREE', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE';
