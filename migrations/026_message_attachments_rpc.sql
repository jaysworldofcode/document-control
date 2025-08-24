-- Create a database function to handle message attachment insertion
-- This function will be called from the backend with service_role permissions
-- and will bypass RLS policies

CREATE OR REPLACE FUNCTION insert_message_attachments(attachment_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
BEGIN
    -- Insert the attachment data directly into the table
    INSERT INTO message_attachments (
        message_id,
        file_name,
        file_size,
        file_type,
        file_path,
        uploaded_by,
        created_at,
        updated_at
    )
    SELECT
        (attachment->>'message_id')::UUID,
        attachment->>'file_name',
        (attachment->>'file_size')::INTEGER,
        attachment->>'file_type',
        attachment->>'file_path',
        (attachment->>'uploaded_by')::UUID,
        NOW(),
        NOW()
    FROM jsonb_array_elements(attachment_data) AS attachment;
END;
$$;
