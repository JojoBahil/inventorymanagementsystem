-- CreateTable
CREATE TABLE `auditlog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `diff` LONGTEXT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_auditlog_actor`(`actorId`),
    INDEX `idx_entity`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    INDEX `fk_cat_parent`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importbatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(191) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `successRows` INTEGER NOT NULL DEFAULT 0,
    `errorRows` INTEGER NOT NULL DEFAULT 0,
    `meta` LONGTEXT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_importbatch_user`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importrow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `rowNumber` INTEGER NOT NULL,
    `raw` LONGTEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_importrow_batch`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NULL,
    `categoryId` INTEGER NULL,
    `baseUomId` INTEGER NOT NULL,
    `brandId` INTEGER NULL,
    `defaultSupplierCompanyId` INTEGER NULL,
    `minStock` DECIMAL(18, 4) NULL,
    `isLotTracked` BOOLEAN NOT NULL DEFAULT false,
    `isSerialized` BOOLEAN NOT NULL DEFAULT false,
    `standardCost` DECIMAL(18, 6) NOT NULL DEFAULT 0.000000,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `sku`(`sku`),
    INDEX `fk_item_category`(`categoryId`),
    INDEX `fk_item_uom`(`baseUomId`),
    INDEX `fk_item_brand`(`brandId`),
    INDEX `fk_item_supplier`(`defaultSupplierCompanyId`),
    INDEX `idx_item_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `brand_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouseId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `uniq_wh_code`(`warehouseId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricelist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `uomId` INTEGER NOT NULL,
    `price` DECIMAL(18, 6) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'PHP',
    `customerId` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_pricelist_customer`(`customerId`),
    INDEX `fk_pricelist_uom`(`uomId`),
    UNIQUE INDEX `uniq_item_uom_customer`(`itemId`, `uomId`, `customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `permissions` LONGTEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,
    `lotId` INTEGER NULL,
    `quantity` DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_stock_loc`(`locationId`),
    INDEX `fk_stock_lot`(`lotId`),
    UNIQUE INDEX `uniq_item_loc_lot`(`itemId`, `locationId`, `lotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocklot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `lotNo` VARCHAR(191) NOT NULL,
    `expiryDate` DATE NULL,
    `locationId` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_stocklot_loc`(`locationId`),
    UNIQUE INDEX `uniq_item_lot`(`itemId`, `lotNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stockmovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `srcLocationId` INTEGER NULL,
    `dstLocationId` INTEGER NULL,
    `lotId` INTEGER NULL,
    `qtyIn` DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    `qtyOut` DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    `unitCost` DECIMAL(18, 6) NOT NULL DEFAULT 0.000000,
    `refHeaderId` INTEGER NULL,
    `refLineId` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_stockmov_dstloc`(`dstLocationId`),
    INDEX `fk_stockmov_header`(`refHeaderId`),
    INDEX `fk_stockmov_line`(`refLineId`),
    INDEX `fk_stockmov_lot`(`lotId`),
    INDEX `fk_stockmov_srcloc`(`srcLocationId`),
    INDEX `idx_item_created`(`itemId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `txnheader` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `docNo` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `companyId` INTEGER NULL,
    `warehouseFromId` INTEGER NULL,
    `warehouseToId` INTEGER NULL,
    `supplierCompanyId` INTEGER NULL,
    `customerCompanyId` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `postedById` INTEGER NULL,
    `postedAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `docNo`(`docNo`),
    INDEX `fk_txn_company`(`companyId`),
    INDEX `fk_txn_customer`(`customerCompanyId`),
    INDEX `fk_txn_postedby`(`postedById`),
    INDEX `fk_txn_supplier`(`supplierCompanyId`),
    INDEX `fk_txn_whfrom`(`warehouseFromId`),
    INDEX `fk_txn_whto`(`warehouseToId`),
    INDEX `idx_type_status`(`type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `txnline` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `headerId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `uomId` INTEGER NOT NULL,
    `lotId` INTEGER NULL,
    `locationId` INTEGER NOT NULL,
    `qty` DECIMAL(18, 4) NOT NULL,
    `unitCost` DECIMAL(18, 6) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_txnline_item`(`itemId`),
    INDEX `fk_txnline_loc`(`locationId`),
    INDEX `fk_txnline_lot`(`lotId`),
    INDEX `fk_txnline_uom`(`uomId`),
    INDEX `idx_txnline_header`(`headerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `defaultFactor` DECIMAL(18, 6) NOT NULL DEFAULT 1.000000,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `hashedPassword` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `email`(`email`),
    INDEX `fk_user_role`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deletedAt` DATETIME(0) NULL,

    UNIQUE INDEX `uniq_company_code`(`companyId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `fk_auditlog_actor` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parentId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `importbatch` ADD CONSTRAINT `fk_importbatch_user` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `importrow` ADD CONSTRAINT `fk_importrow_batch` FOREIGN KEY (`batchId`) REFERENCES `importbatch`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `fk_item_category` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `fk_item_uom` FOREIGN KEY (`baseUomId`) REFERENCES `uom`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `fk_item_brand` FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `fk_item_supplier` FOREIGN KEY (`defaultSupplierCompanyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `location` ADD CONSTRAINT `fk_loc_wh` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pricelist` ADD CONSTRAINT `fk_pricelist_customer` FOREIGN KEY (`customerId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pricelist` ADD CONSTRAINT `fk_pricelist_item` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pricelist` ADD CONSTRAINT `fk_pricelist_uom` FOREIGN KEY (`uomId`) REFERENCES `uom`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_item` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_loc` FOREIGN KEY (`locationId`) REFERENCES `location`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `fk_stock_lot` FOREIGN KEY (`lotId`) REFERENCES `stocklot`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stocklot` ADD CONSTRAINT `fk_stocklot_item` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stocklot` ADD CONSTRAINT `fk_stocklot_loc` FOREIGN KEY (`locationId`) REFERENCES `location`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_dstloc` FOREIGN KEY (`dstLocationId`) REFERENCES `location`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_header` FOREIGN KEY (`refHeaderId`) REFERENCES `txnheader`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_item` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_line` FOREIGN KEY (`refLineId`) REFERENCES `txnline`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_lot` FOREIGN KEY (`lotId`) REFERENCES `stocklot`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stockmovement` ADD CONSTRAINT `fk_stockmov_srcloc` FOREIGN KEY (`srcLocationId`) REFERENCES `location`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_company` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_customer` FOREIGN KEY (`customerCompanyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_postedby` FOREIGN KEY (`postedById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_supplier` FOREIGN KEY (`supplierCompanyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_whfrom` FOREIGN KEY (`warehouseFromId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnheader` ADD CONSTRAINT `fk_txn_whto` FOREIGN KEY (`warehouseToId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnline` ADD CONSTRAINT `fk_txnline_header` FOREIGN KEY (`headerId`) REFERENCES `txnheader`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnline` ADD CONSTRAINT `fk_txnline_item` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnline` ADD CONSTRAINT `fk_txnline_loc` FOREIGN KEY (`locationId`) REFERENCES `location`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnline` ADD CONSTRAINT `fk_txnline_lot` FOREIGN KEY (`lotId`) REFERENCES `stocklot`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `txnline` ADD CONSTRAINT `fk_txnline_uom` FOREIGN KEY (`uomId`) REFERENCES `uom`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `fk_wh_company` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
