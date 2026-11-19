CREATE TABLE `client` (
	`id` text PRIMARY KEY,
	`user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_client_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`event_type` text NOT NULL,
	`preset` text NOT NULL,
	`card` text,
	`couple_image_key` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_event_client_id_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `client`(`id`)
);
--> statement-breakpoint
CREATE TABLE `party` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`display_name` text NOT NULL,
	`invited_as` text NOT NULL,
	`seats` integer NOT NULL,
	`seat_label` text,
	`rules` text,
	`locale` text NOT NULL,
	`shared` integer DEFAULT false NOT NULL,
	`revoked` integer DEFAULT false NOT NULL,
	`opens` integer DEFAULT 0 NOT NULL,
	`first_opened_at` integer,
	`last_opened_at` integer,
	`rsvp` text DEFAULT 'pending' NOT NULL,
	`confirmed_seats` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_party_client_id_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `client`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_userId_uq` ON `client` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_clientId_uq` ON `event` (`client_id`);--> statement-breakpoint
CREATE INDEX `party_clientId_idx` ON `party` (`client_id`);
