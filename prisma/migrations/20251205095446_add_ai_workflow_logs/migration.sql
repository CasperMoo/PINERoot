-- CreateTable
CREATE TABLE `ai_workflow_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workflowName` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `requestParams` JSON NOT NULL,
    `responseStatus` VARCHAR(191) NOT NULL,
    `tokenInput` INTEGER NULL,
    `tokenOutput` INTEGER NULL,
    `tokenTotal` INTEGER NULL,
    `errorCode` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `durationMs` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_workflow_logs_workflowName_createdAt_idx`(`workflowName`, `createdAt`),
    INDEX `ai_workflow_logs_responseStatus_idx`(`responseStatus`),
    INDEX `ai_workflow_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
