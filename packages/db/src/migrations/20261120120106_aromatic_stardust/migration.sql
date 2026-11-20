CREATE TABLE `event_admin` (
	`id` text PRIMARY KEY,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`granted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_event_admin_event_id_event_id_fk` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`),
	CONSTRAINT `fk_event_admin_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'host' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `event_admin_event_user_uq` ON `event_admin` (`event_id`,`user_id`);
--> statement-breakpoint
-- Backfill: every existing invitation's owner (the hosting user of its client).
INSERT INTO `event_admin` (`id`, `event_id`, `user_id`, `role`, `granted_at`)
SELECT substr(hex(randomblob(16)), 1, 22), `event`.`id`, `client`.`user_id`, 'owner', `event`.`created_at`
FROM `event`
JOIN `client` ON `client`.`id` = `event`.`client_id`;
--> statement-breakpoint
-- Parties created before invitations existed have no event_id; point them at their client's invitation.
UPDATE `party`
SET `event_id` = (SELECT `event`.`id` FROM `event` WHERE `event`.`client_id` = `party`.`client_id`)
WHERE `party`.`event_id` IS NULL;