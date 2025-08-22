import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChatMessage, ChatReaction } from '@/types/chat.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseSupabaseRealtimeChatReturn {
  isConnected: boolean;
  onNewMessage: ((callback: (message: ChatMessage) => void) => void) | null;
  onMessageUpdate: ((callback: (message: ChatMessage) => void) => void) | null;
  onMessageDelete: ((callback: (messageId: string) => void) => void) | null;
  onReactionUpdate: ((callback: (messageId: string, reactions: ChatReaction[]) => void) => void) | null;
}

export function useSupabaseRealtimeChat(projectId: string): UseSupabaseRealtimeChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  
  // Callback handlers
  const [newMessageCallback, setNewMessageCallback] = useState<((message: ChatMessage) => void) | null>(null);
  const [messageUpdateCallback, setMessageUpdateCallback] = useState<((message: ChatMessage) => void) | null>(null);
  const [messageDeleteCallback, setMessageDeleteCallback] = useState<((messageId: string) => void) | null>(null);
  const [reactionUpdateCallback, setReactionUpdateCallback] = useState<((messageId: string, reactions: ChatReaction[]) => void) | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Create a channel for this project's chat
    const chatChannel = supabase
      .channel(`project_chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          if (newMessageCallback && payload.new) {
            // Fetch user info for the new message
            const { data: userInfo } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', payload.new.user_id)
              .single();

            const formattedMessage: ChatMessage = {
              id: payload.new.id,
              projectId: payload.new.project_id,
              userId: payload.new.user_id,
              userName: userInfo?.name || 'Unknown User',
              userEmail: userInfo?.email || '',
              content: payload.new.content,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              isEdited: payload.new.is_edited || false,
              messageType: payload.new.message_type || 'text',
              replyTo: payload.new.reply_to,
              attachments: [],
              reactions: []
            };

            newMessageCallback(formattedMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Message updated:', payload);
          
          if (messageUpdateCallback && payload.new) {
            // Fetch user info for the updated message
            const { data: userInfo } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', payload.new.user_id)
              .single();

            const formattedMessage: ChatMessage = {
              id: payload.new.id,
              projectId: payload.new.project_id,
              userId: payload.new.user_id,
              userName: userInfo?.name || 'Unknown User',
              userEmail: userInfo?.email || '',
              content: payload.new.content,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              isEdited: payload.new.is_edited || false,
              messageType: payload.new.message_type || 'text',
              replyTo: payload.new.reply_to,
              attachments: [],
              reactions: []
            };

            messageUpdateCallback(formattedMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'project_chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Message deleted:', payload);
          
          if (messageDeleteCallback && payload.old) {
            messageDeleteCallback(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(chatChannel);

    return () => {
      console.log('Unsubscribing from chat channel');
      chatChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [projectId, newMessageCallback, messageUpdateCallback, messageDeleteCallback, reactionUpdateCallback]);

  // Callback setters
  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    setNewMessageCallback(() => callback);
  }, []);

  const onMessageUpdate = useCallback((callback: (message: ChatMessage) => void) => {
    setMessageUpdateCallback(() => callback);
  }, []);

  const onMessageDelete = useCallback((callback: (messageId: string) => void) => {
    setMessageDeleteCallback(() => callback);
  }, []);

  const onReactionUpdate = useCallback((callback: (messageId: string, reactions: ChatReaction[]) => void) => {
    setReactionUpdateCallback(() => callback);
  }, []);

  return {
    isConnected,
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
    onReactionUpdate
  };
}
