-- CreateTable
CREATE TABLE `word_library` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `originalText` VARCHAR(500) NOT NULL,
    `language` ENUM('CHINESE', 'JAPANESE') NOT NULL,
    `translationData` JSON NOT NULL,
    `queryCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `word_library_originalText_key`(`originalText`),
    INDEX `word_library_language_idx`(`language`),
    INDEX `word_library_queryCount_idx`(`queryCount`),
    INDEX `word_library_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_vocabulary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `wordId` INTEGER NOT NULL,
    `note` TEXT NULL,
    `status` ENUM('NEW', 'LEARNING', 'MASTERED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_vocabulary_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `user_vocabulary_userId_status_idx`(`userId`, `status`),
    UNIQUE INDEX `user_vocabulary_userId_wordId_key`(`userId`, `wordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
