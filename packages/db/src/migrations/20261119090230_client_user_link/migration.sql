DELETE FROM `client`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_client` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL REFERENCES user(id),
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
DROP TABLE `client`;--> statement-breakpoint
ALTER TABLE `__new_client` RENAME TO `client`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `client_tokenHash_uq`;--> statement-breakpoint
CREATE UNIQUE INDEX `client_userId_uq` ON `client` (`user_id`);
