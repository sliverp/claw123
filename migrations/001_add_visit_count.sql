-- Migration 001: Add visit_count to claw_stats
-- Description: 为 claw_stats 表添加 visit_count 字段，用于记录每个 claw 的访问次数

-- SQLite:
-- ALTER TABLE claw_stats ADD COLUMN visit_count INTEGER NOT NULL DEFAULT 0;

-- MySQL:
-- ALTER TABLE claw_stats ADD COLUMN visit_count INT NOT NULL DEFAULT 0;
