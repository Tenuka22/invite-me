ALTER TABLE `party` ADD `event_id` text REFERENCES event(id);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_client` (
	`id` text PRIMARY KEY,
	`token_hash` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_client`(`id`, `created_at`) SELECT `id`, `created_at` FROM `client`;--> statement-breakpoint
DROP TABLE `client`;--> statement-breakpoint
ALTER TABLE `__new_client` RENAME TO `client`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `client_userId_uq`;--> statement-breakpoint
DROP INDEX IF EXISTS `event_clientId_uq`;--> statement-breakpoint
CREATE UNIQUE INDEX `client_tokenHash_uq` ON `client` (`token_hash`);--> statement-breakpoint
CREATE INDEX `event_clientId_idx` ON `event` (`client_id`);--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `is_anonymous`;