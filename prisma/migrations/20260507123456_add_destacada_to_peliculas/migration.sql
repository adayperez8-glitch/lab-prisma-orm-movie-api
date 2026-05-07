-- Create a temporary table to back up data if needed (optional, destacada has default)
-- Add column destacada to peliculas
ALTER TABLE "peliculas" ADD COLUMN "destacada" BOOLEAN NOT NULL DEFAULT false;
