--> statement-breakpoint
CREATE TABLE `new_count` (
	`user_id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);

--> statement-breakpoint
INSERT INTO `new_count` (`user_id`, `count`)
SELECT `user_id`, `count` FROM `count`;

--> statement-breakpoint
DROP TABLE `count`;

--> statement-breakpoint
ALTER TABLE `new_count` RENAME TO `count`;