"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Send, 
  Heart, 
  ThumbsUp, 
  CheckCircle,
  XCircle,
  Paperclip,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  File,
  X,
  Download
} from "lucide-react";
import { DocumentComment, NewCommentData, CommentReaction } from "@/types/comment.types";

interface DocumentCommentsProps {
  documentId: string;
  comments: DocumentComment[];
  onAddComment: (data: NewCommentData) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReactToComment: (commentId: string, reactionType: CommentReaction['type']) => Promise<void>;
  currentUserId: string;
  currentUserName: string;
}

export function DocumentComments({
  documentId,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onReactToComment,
  currentUserId,
  currentUserName
}: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group comments by parent/replies
  const commentTree = comments.reduce((acc, comment) => {
    if (!comment.replyTo) {
      acc[comment.id] = { ...comment, replies: [] };
    }
    return acc;
  }, {} as Record<string, DocumentComment & { replies: DocumentComment[] }>);

  // Add replies to their parent comments
  comments.forEach(comment => {
    if (comment.replyTo && commentTree[comment.replyTo]) {
      commentTree[comment.replyTo].replies.push(comment);
    }
  });

  const topLevelComments = Object.values(commentTree).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmitComment = async () => {
    if (!newComment.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        content: newComment,
        replyTo: replyingTo || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      
      setNewComment('');
      setReplyingTo(null);
      setAttachments([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await onUpdateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startEditing = (comment: DocumentComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getReactionCount = (comment: DocumentComment, type: CommentReaction['type']) => {
    return comment.reactions?.filter(r => r.type === type).length || 0;
  };

  const hasUserReacted = (comment: DocumentComment, type: CommentReaction['type']) => {
    return comment.reactions?.some(r => r.type === type && r.userId === currentUserId) || false;
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

  const CommentItem = ({ comment, isReply = false }: { comment: DocumentComment & { replies?: DocumentComment[] }; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.userName}</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">Edited</Badge>
                )}
              </div>
              
              {comment.userId === currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditing(comment)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {comment.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reactions and Reply */}
        <div className="flex items-center gap-2 text-xs">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-6 text-xs ${hasUserReacted(comment, 'like') ? 'text-blue-600' : ''}`}
            onClick={() => onReactToComment(comment.id, 'like')}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            {getReactionCount(comment, 'like') || 'Like'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-6 text-xs ${hasUserReacted(comment, 'love') ? 'text-red-600' : ''}`}
            onClick={() => onReactToComment(comment.id, 'love')}
          >
            <Heart className="h-3 w-3 mr-1" />
            {getReactionCount(comment, 'love') || 'Love'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-6 text-xs ${hasUserReacted(comment, 'helpful') ? 'text-green-600' : ''}`}
            onClick={() => onReactToComment(comment.id, 'helpful')}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {getReactionCount(comment, 'helpful') || 'Helpful'}
          </Button>
          
          {!isReply && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies
              .sort((a: DocumentComment, b: DocumentComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((reply: DocumentComment) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
          </div>
        )}

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <div className="ml-12 mt-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(currentUserName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Reply to ${comment.userName}...`}
                      className="min-h-[60px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-3 w-3 mr-1" />
                          Attach
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isSubmitting}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* New Comment Input */}
      {!replyingTo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(currentUserName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[80px]"
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded border">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() && attachments.length === 0 || isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileAttachment}
      />

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No comments yet</h3>
            <p className="text-muted-foreground">Be the first to comment on this document.</p>
          </div>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
