"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Minimize2,
  Maximize2,
  X,
  Users,
  MoreHorizontal,
  Smile,
  Settings,
  File,
  Download,
  Reply,
  Heart,
  ThumbsUp,
  Clock,
  CheckCheck
} from "lucide-react";
import { ChatMessage, NewChatMessage, ProjectChat, ChatParticipant, ChatReaction } from "@/types/chat.types";

interface ProjectChatBoxProps {
  projectId: string;
  projectName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function ProjectChatBox({
  projectId,
  projectName,
  currentUser,
  isVisible,
  onToggleVisibility
}: ProjectChatBoxProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - in real app this would come from API/WebSocket
  useEffect(() => {
    if (isVisible) {
      // Mock participants
      const mockParticipants: ChatParticipant[] = [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          role: 'manager'
        },
        {
          userId: 'user_456',
          userName: 'Sarah Wilson',
          userEmail: 'sarah.wilson@company.com',
          isOnline: true,
          lastSeen: new Date().toISOString(),
          role: 'manager'
        },
        {
          userId: 'user_789',
          userName: 'Mike Johnson',
          userEmail: 'mike.johnson@company.com',
          isOnline: false,
          lastSeen: '2024-08-20T10:30:00Z',
          role: 'member'
        }
      ];

      // Mock messages
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg_1',
          projectId,
          userId: 'user_456',
          userName: 'Sarah Wilson',
          userEmail: 'sarah.wilson@company.com',
          content: 'Hey team! Just uploaded the latest system architecture document. Please review when you have a chance.',
          createdAt: '2024-08-20T09:00:00Z',
          isEdited: false,
          messageType: 'text',
          reactions: [
            { id: 'reaction_1', userId: currentUser.id, userName: currentUser.name, type: 'like', createdAt: '2024-08-20T09:01:00Z' }
          ]
        },
        {
          id: 'msg_2',
          projectId,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          content: 'Thanks Sarah! I\'ll take a look at it this afternoon. Do you have any specific areas you want me to focus on?',
          createdAt: '2024-08-20T09:15:00Z',
          isEdited: false,
          messageType: 'text',
          replyTo: 'msg_1'
        },
        {
          id: 'msg_3',
          projectId,
          userId: 'user_789',
          userName: 'Mike Johnson',
          userEmail: 'mike.johnson@company.com',
          content: 'I can help with the database schema review. I noticed some optimization opportunities in the previous version.',
          createdAt: '2024-08-20T10:30:00Z',
          isEdited: false,
          messageType: 'text'
        }
      ];

      setParticipants(mockParticipants);
      setMessages(mockMessages);
    }
  }, [isVisible, projectId, currentUser]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      projectId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      content: newMessage,
      createdAt: new Date().toISOString(),
      isEdited: false,
      messageType: attachments.length > 0 ? 'file' : 'text',
      replyTo: replyingTo?.id,
      attachments: attachments.map((file, index) => ({
        id: `attachment_${Date.now()}_${index}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setAttachments([]);
    setReplyingTo(null);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReaction = (messageId: string, reactionType: ChatReaction['type']) => {
    setMessages(prev => prev.map(message => {
      if (message.id !== messageId) return message;
      
      const reactions = message.reactions || [];
      const existingReaction = reactions.find(r => r.userId === currentUser.id && r.type === reactionType);
      
      if (existingReaction) {
        return {
          ...message,
          reactions: reactions.filter(r => r.id !== existingReaction.id)
        };
      } else {
        const newReaction: ChatReaction = {
          id: `reaction_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          type: reactionType,
          createdAt: new Date().toISOString()
        };
        return {
          ...message,
          reactions: [...reactions, newReaction]
        };
      }
    }));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getOnlineCount = () => {
    return participants.filter(p => p.isOnline).length;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-4 w-80 z-50">
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        {/* Chat Header */}
        <CardHeader className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-semibold text-blue-900">
                  {projectName}
                </CardTitle>
                <p className="text-xs text-blue-600">
                  {getOnlineCount()} of {participants.length} online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={onToggleVisibility}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            {/* Participants Bar */}
            <div className="p-2 bg-gray-50 border-b">
              <div className="flex items-center gap-1 overflow-x-auto">
                {participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-1 shrink-0">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(participant.userName)}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 truncate max-w-16">
                      {participant.userName.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <CardContent className="p-0">
              <div className="h-80 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.userId === currentUser.id;
                  const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
                  
                  return (
                    <div key={message.id} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.userName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                        {/* Reply indicator */}
                        {repliedMessage && (
                          <div className={`text-xs text-gray-500 mb-1 p-2 bg-gray-100 rounded border-l-2 border-gray-300 ${isOwnMessage ? 'text-right' : ''}`}>
                            <div className="font-medium">{repliedMessage.userName}</div>
                            <div className="truncate">{repliedMessage.content}</div>
                          </div>
                        )}
                        
                        <div className={`p-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-sm">{message.content}</div>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-1 bg-white/10 rounded">
                                  <File className="h-3 w-3" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{attachment.fileName}</div>
                                    <div className="text-xs opacity-75">{formatFileSize(attachment.fileSize)}</div>
                                  </div>
                                  <Button size="icon" variant="ghost" className="h-5 w-5">
                                    <Download className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className={`text-xs mt-1 flex items-center gap-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-500'}>
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwnMessage && <CheckCheck className="h-3 w-3 text-blue-200" />}
                          </div>
                        </div>
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {['like', 'love', 'laugh'].map(type => {
                              const count = message.reactions?.filter(r => r.type === type).length || 0;
                              if (count === 0) return null;
                              
                              return (
                                <Button
                                  key={type}
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1 text-xs"
                                  onClick={() => handleReaction(message.id, type as ChatReaction['type'])}
                                >
                                  {type === 'like' && '👍'}
                                  {type === 'love' && '❤️'}
                                  {type === 'laugh' && '😂'}
                                  {count}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => handleReaction(message.id, 'like')}>
                            <ThumbsUp className="h-2 w-2" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => handleReaction(message.id, 'love')}>
                            <Heart className="h-2 w-2" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => setReplyingTo(message)}>
                            <Reply className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {isTyping.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                    <span className="text-xs">
                      {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Reply indicator */}
              {replyingTo && (
                <div className="px-3 py-2 bg-blue-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-3 w-3 text-blue-600" />
                    <div className="text-xs">
                      <span className="font-medium">Replying to {replyingTo.userName}</span>
                      <div className="text-gray-500 truncate max-w-40">{replyingTo.content}</div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => setReplyingTo(null)}>
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              )}

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="px-3 py-2 bg-gray-50 border-b space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-1 bg-white rounded border">
                      <File className="h-3 w-3 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-4 w-4"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="border-0 focus-visible:ring-0 shadow-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && attachments.length === 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileAttachment}
              />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
