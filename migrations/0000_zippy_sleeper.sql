CREATE TABLE `fields` (
	`name` text NOT NULL,
	`type` text NOT NULL,
	`format` text,
	`is_array` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by` text DEFAULT 'SYSTEM' NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_by` text DEFAULT 'SYSTEM' NOT NULL,
	PRIMARY KEY(`name`, `type`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`level` text DEFAULT 'INFO' NOT NULL,
	`message` text,
	`fields` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by` text DEFAULT 'SYSTEM' NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_by` text DEFAULT 'SYSTEM' NOT NULL
);
