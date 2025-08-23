import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to upload chat attachment to Supabase storage
export async function uploadChatAttachmentToStorage(file: File, userId: string, messageId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `chat/${userId}/${messageId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(fileName);

  return {
    storagePath: fileName,
    storageUrl: urlData.publicUrl
  };
}

// Helper function to delete chat attachment from storage
export async function deleteChatAttachmentFromStorage(storagePath: string) {
  const { error } = await supabase.storage
    .from('chat-attachments')
    .remove([storagePath]);

  if (error) {
    throw new Error(`Storage deletion failed: ${error.message}`);
  }
}
