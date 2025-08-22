import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChatMessage, ChatReaction } from '@/types/chat.types';

// For realtime, we need to use service role to bypass RLS
// This is safe because we still check permissions in our API endpoints
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
  
  // Use refs for callbacks to avoid dependency issues
  const newMessageCallbackRef = useRef<((message: ChatMessage) => void) | null>(null);
  const messageUpdateCallbackRef = useRef<((message: ChatMessage) => void) | null>(null);
  const messageDeleteCallbackRef = useRef<((messageId: string) => void) | null>(null);
  const reactionUpdateCallbackRef = useRef<((messageId: string, reactions: ChatReaction[]) => void) | null>(null);

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
          
          if (newMessageCallbackRef.current && payload.new) {
            // Fetch user info for the new message
            const { data: userInfo } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', payload.new.user_id)
              .single();

            const formattedMessage: ChatMessage = {
              id: payload.new.id,
              projectId: payload.new.project_id,
              userId: payload.new.user_id,
              userName: `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 'Unknown User',
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

            newMessageCallbackRef.current(formattedMessage);
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
          
          if (messageUpdateCallbackRef.current && payload.new) {
            // Fetch user info for the updated message
            const { data: userInfo } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', payload.new.user_id)
              .single();

            const formattedMessage: ChatMessage = {
              id: payload.new.id,
              projectId: payload.new.project_id,
              userId: payload.new.user_id,
              userName: `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 'Unknown User',
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

            messageUpdateCallbackRef.current(formattedMessage);
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
          
          if (messageDeleteCallbackRef.current && payload.old) {
            messageDeleteCallbackRef.current(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_chat_reactions'
        },
        async (payload) => {
          console.log('Reaction updated:', payload);
          
          if (reactionUpdateCallbackRef.current && (payload.new || payload.old)) {
            const messageId = payload.new?.message_id || payload.old?.message_id;
            
            if (messageId) {
              // Fetch updated reactions for this message
              const { data: reactions } = await supabase
                .from('project_chat_reactions')
                .select(`
                  id,
                  reaction_type,
                  created_at,
                  users(id, first_name, last_name)
                `)
                .eq('message_id', messageId);

              const formattedReactions: ChatReaction[] = reactions?.map(reaction => ({
                id: reaction.id,
                type: reaction.reaction_type as ChatReaction['type'],
                userId: (reaction.users as any)?.id,
                userName: `${(reaction.users as any)?.first_name || ''} ${(reaction.users as any)?.last_name || ''}`.trim() || 'Unknown User',
                createdAt: reaction.created_at
              })) || [];

              reactionUpdateCallbackRef.current(messageId, formattedReactions);
            }
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
  }, [projectId]); // Remove callback dependencies to prevent re-subscriptions

  // Callback setters
  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    newMessageCallbackRef.current = callback;
  }, []);

  const onMessageUpdate = useCallback((callback: (message: ChatMessage) => void) => {
    messageUpdateCallbackRef.current = callback;
  }, []);

  const onMessageDelete = useCallback((callback: (messageId: string) => void) => {
    messageDeleteCallbackRef.current = callback;
  }, []);

  const onReactionUpdate = useCallback((callback: (messageId: string, reactions: ChatReaction[]) => void) => {
    reactionUpdateCallbackRef.current = callback;
  }, []);

  return {
    isConnected,
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
    onReactionUpdate
  };
}
