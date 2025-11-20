-- CreateTable
CREATE TABLE `Reminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `frequency` ENUM('ONCE', 'DAILY', 'EVERY_X_DAYS', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `interval` INTEGER NULL,
    `weekDays` VARCHAR(100) NULL,
    `dayOfMonth` INTEGER NULL,
    `startDate` DATE NULL,
    `lastCompletedDate` DATE NULL,
    `nextTriggerDate` DATE NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reminder_userId_deletedAt_idx`(`userId`, `deletedAt`),
    INDEX `Reminder_nextTriggerDate_deletedAt_idx`(`nextTriggerDate`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
