CREATE TABLE `rate_limits` (
	`bucket` text PRIMARY KEY,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL
);
