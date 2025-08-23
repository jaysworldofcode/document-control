-- Remove SharePoint folder path column from projects table
-- Migration: 012_remove_sharepoint_folder_path.sql
-- Description: Remove the sharepoint_folder_path column to simplify SharePoint configuration

ALTER TABLE projects DROP COLUMN IF EXISTS sharepoint_folder_path;
