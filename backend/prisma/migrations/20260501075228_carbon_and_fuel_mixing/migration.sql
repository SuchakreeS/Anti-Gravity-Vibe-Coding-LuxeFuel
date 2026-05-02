-- AlterTable
ALTER TABLE `car` ADD COLUMN `currentCarbonFactor` DOUBLE NOT NULL DEFAULT 2.31;

-- AlterTable
ALTER TABLE `fuelrecord` ADD COLUMN `carbonEmitted` DOUBLE NULL,
    ADD COLUMN `fuelType` ENUM('GASOLINE', 'DIESEL', 'E20', 'E85') NOT NULL DEFAULT 'GASOLINE';
