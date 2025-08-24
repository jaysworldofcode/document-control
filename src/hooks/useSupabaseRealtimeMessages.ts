"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  sent_at: string;
  read_at?: string | null;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  recipient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface UseSupabaseRealtimeMessagesReturn {
  isConnected: boolean;
  onNewMessage: ((callback: (message: Message) => void) => void);
  onReactionChange: ((callback: (messageId: string, reaction: MessageReaction, isAdded: boolean) => void) => void);
  sendMessage: (recipientId: string, message: string, files?: File[]) => Promise<Message | null>;
  sendReaction: (messageId: string, reaction: string) => Promise<boolean>;
  removeReaction: (messageId: string, reaction: string) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<{ path: string; fileName: string; fileSize: number; fileType: string; } | null>;
}

export function useSupabaseRealtimeMessages(currentUserId: string, organizationId: string = 'org_global'): UseSupabaseRealtimeMessagesReturn {
  const [isConnected, setIsConnected] = useState(false);
  
    // Use refs for callbacks to avoid dependency issues
  const newMessageCallbackRef = useRef<((message: Message) => void) | null>(null);
  const reactionChangeCallbackRef = useRef<((messageId: string, reaction: MessageReaction, isAdded: boolean) => void) | null>(null);
  
  // Set up realtime subscription
  useEffect(() => {
    // if (!currentUserId) {
    //   console.log('No user ID provided for realtime messages');
    //   return;
    // }
    
    console.log('Setting up realtime subscription for organization messages:', organizationId, 'user:', currentUserId);
    
    // Create a channel for all organization messages (we'll filter by recipient in memory)
    const channelId = `messages`;
    console.log('Channel ID:', channelId);    const messagesChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
          // No filter - we'll receive all messages for the organization and filter in memory
        },
        async (payload: any) => {
          console.log('New message in organization received:', payload);
          
          // Check if this message is relevant to the current user (either as sender or recipient)
          if (payload.new && 
              (payload.new.sender_id === currentUserId || payload.new.recipient_id === currentUserId) &&
              newMessageCallbackRef.current) {
            console.log('Message is relevant to current user, processing...');
            
            try {
              // Fetch sender info
              const { data: senderData } = await supabase
                .from('users')
                .select('id, first_name, last_name, email')
                .eq('id', payload.new.sender_id)
                .single();
                
              // Fetch recipient info
              const { data: recipientData } = await supabase
                .from('users')
                .select('id, first_name, last_name, email')
                .eq('id', payload.new.recipient_id)
                .single();
              
              // Use type assertion to avoid TypeScript errors  
              const sender = senderData as Message['sender'];
              const recipient = recipientData as Message['recipient'];
                
              const formattedMessage: Message = {
                id: payload.new.id,
                sender_id: payload.new.sender_id,
                recipient_id: payload.new.recipient_id,
                message: payload.new.message,
                sent_at: payload.new.sent_at,
                read_at: payload.new.read_at,
                sender,
                recipient
              };
              
              newMessageCallbackRef.current(formattedMessage);
              console.log('New message processed and callback invoked:', formattedMessage);
            } catch (error) {
              console.error('Error processing new message:', error);
            }
          } else {
            console.log('Message is not relevant to current user, ignoring');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT and DELETE
          schema: 'public',
          table: 'message_reactions'
        },
        async (payload: any) => {
          console.log('Reaction change detected:', payload);
          
          if (!payload.new && !payload.old) {
            console.log('No reaction data in payload, ignoring');
            return;
          }
          
          // Get the message ID from the payload
          const messageId = payload.new?.message_id || payload.old?.message_id;
          
          if (!messageId) {
            console.log('No message ID in reaction payload, ignoring');
            return;
          }
          
          // Check if this message is relevant to the current user
          const { data: message } = await supabase
            .from('messages')
            .select('sender_id, recipient_id')
            .eq('id', messageId)
            .single();
            
          if (!message || (message.sender_id !== currentUserId && message.recipient_id !== currentUserId)) {
            console.log('Reaction is for a message not relevant to current user, ignoring');
            return;
          }
          
          // If it's a reaction INSERT
          if (payload.eventType === 'INSERT' && payload.new) {
            console.log('New reaction added:', payload.new);
            
            if (reactionChangeCallbackRef.current) {
              try {
                // Fetch user info for the reaction
                const { data: userData } = await supabase
                  .from('users')
                  .select('id, first_name, last_name')
                  .eq('id', payload.new.user_id)
                  .single();
                
                const reaction: MessageReaction = {
                  id: payload.new.id,
                  message_id: payload.new.message_id,
                  user_id: payload.new.user_id,
                  reaction: payload.new.reaction,
                  created_at: payload.new.created_at,
                  user: userData || undefined
                };
                
                reactionChangeCallbackRef.current(messageId, reaction, true);
              } catch (error) {
                console.error('Error processing new reaction:', error);
              }
            }
          }
          
          // If it's a reaction DELETE
          if (payload.eventType === 'DELETE' && payload.old) {
            console.log('Reaction removed:', payload.old);
            
            if (reactionChangeCallbackRef.current) {
              const reaction: MessageReaction = {
                id: payload.old.id,
                message_id: payload.old.message_id,
                user_id: payload.old.user_id,
                reaction: payload.old.reaction,
                created_at: payload.old.created_at
              };
              
              reactionChangeCallbackRef.current(messageId, reaction, false);
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Organization messages subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
      
    return () => {
      console.log('Cleaning up organization messages subscription');
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, organizationId]);
  
  // Register callback for new messages
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    newMessageCallbackRef.current = callback;
  }, []);
  
  // Register callback for reaction changes
  const onReactionChange = useCallback((callback: (messageId: string, reaction: MessageReaction, isAdded: boolean) => void) => {
    reactionChangeCallbackRef.current = callback;
  }, []);
  
  // Send a new message
  const sendMessage = useCallback(async (recipientId: string, message: string, files: File[] = []): Promise<Message | null> => {
    if (!currentUserId || !recipientId || (!message.trim() && files.length === 0)) {
      return null;
    }
    
    try {
      // Upload any attachments first
      const attachmentPromises = files.map(file => uploadAttachment(file));
      const attachmentResults = await Promise.all(attachmentPromises);
      const attachments = attachmentResults.filter(result => result !== null) as Array<{
        path: string;
        fileName: string;
        fileSize: number;
        fileType: string;
      }>;
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          message: message.trim(),
          attachments: attachments.length > 0 ? attachments : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [currentUserId]);
  
  // Upload file attachment to Supabase storage
  const uploadAttachment = useCallback(async (file: File): Promise<{ path: string; fileName: string; fileSize: number; fileType: string; } | null> => {
    if (!currentUserId || !file) {
      return null;
    }
    
    try {
      // Create a unique path for the file
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      return {
        path: data.path,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  }, [currentUserId]);
  
  // Add reaction to a message
  const sendReaction = useCallback(async (messageId: string, reaction: string): Promise<boolean> => {
    if (!currentUserId || !messageId || !reaction) {
      return false;
    }
    
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          reaction
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error sending reaction:', error);
      return false;
    }
  }, [currentUserId]);
  
  // Remove reaction from a message
  const removeReaction = useCallback(async (messageId: string, reaction: string): Promise<boolean> => {
    if (!currentUserId || !messageId || !reaction) {
      return false;
    }
    
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          reaction
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }, [currentUserId]);
  
  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await fetch(`/api/messages/read/${messageId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);
  
  return {
    isConnected,
    onNewMessage,
    onReactionChange,
    sendMessage,
    markAsRead,
    sendReaction,
    removeReaction,
    uploadAttachment
  };
}
