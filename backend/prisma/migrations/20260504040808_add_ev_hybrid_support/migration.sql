-- AlterTable
ALTER TABLE `car` ADD COLUMN `batteryCapacity` DOUBLE NULL,
    ADD COLUMN `engineType` ENUM('ICE', 'EV', 'PHEV', 'HEV') NOT NULL DEFAULT 'ICE';

-- AlterTable
ALTER TABLE `fuelrecord` ADD COLUMN `kwhAdded` DOUBLE NULL,
    ADD COLUMN `pricePerKwh` DOUBLE NULL,
    MODIFY `pricePerLitre` DOUBLE NULL,
    MODIFY `litresRefueled` DOUBLE NULL,
    MODIFY `fuelType` ENUM('GASOLINE', 'DIESEL', 'E20', 'E85', 'ELECTRICITY') NOT NULL DEFAULT 'GASOLINE';
