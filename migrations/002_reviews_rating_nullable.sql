-- Migration 002: Make reviews.rating nullable and drop CHECK constraint
-- Since reviews and ratings are now separate, reviews no longer need a rating field

-- MySQL: Drop the CHECK constraint and alter column to allow NULL
ALTER TABLE reviews DROP CHECK reviews_chk_1;
ALTER TABLE reviews MODIFY COLUMN rating INT NULL DEFAULT NULL;

-- SQLite: SQLite does not support DROP CHECK or MODIFY COLUMN.
-- The reviews table CHECK constraint only applies at INSERT/UPDATE time.
-- Since we no longer insert rating in reviews, this is not an issue for new SQLite databases.
-- For existing SQLite databases, you would need to recreate the table without the CHECK constraint.
