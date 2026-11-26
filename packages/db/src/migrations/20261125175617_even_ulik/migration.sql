ALTER TABLE `party` ADD `event_id` text REFERENCES event(id) ON DELETE CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS `event_clientId_uq`;--> statement-breakpoint
CREATE INDEX `event_clientId_idx` ON `event` (`client_id`);--> statement-breakpoint
CREATE INDEX `party_eventId_idx` ON `party` (`event_id`);--> statement-breakpoint
UPDATE `party` SET `event_id` = (SELECT `id` FROM `event` WHERE `event`.`client_id` = `party`.`client_id` ORDER BY `created_at` LIMIT 1) WHERE `event_id` IS NULL;