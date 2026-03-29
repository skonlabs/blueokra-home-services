import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Regex patterns for phone numbers and emails
const PHONE_REGEX = /(\+?\d[\d\s\-().]{6,}\d|\(\d{3}\)\s*\d{3}[\s\-]?\d{4}|\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4})/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

export function containsContactInfo(text: string): boolean {
  return PHONE_REGEX.test(text) || EMAIL_REGEX.test(text);
}

export function maskContactInfo(text: string): string {
  return text
    .replace(PHONE_REGEX, (m) => "*".repeat(m.length))
    .replace(EMAIL_REGEX, (m) => "*".repeat(m.length));
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  image_url: string | null;
  attachments: any;
  read: boolean;
  created_at: string;
  lead_id: string | null;
  appointment_id: string | null;
}

export interface Conversation {
  conversation_user_id: string;
  conversation_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_conversations", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return (data || []) as Conversation[];
    },
  });
};

export const useChatMessages = (otherUserId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark unread messages as read
      if (data?.length) {
        const unread = data.filter(
          (m) => m.receiver_id === user!.id && !m.read
        );
        if (unread.length) {
          await supabase
            .from("chats")
            .update({ read: true })
            .in(
              "id",
              unread.map((m) => m.id)
            );
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      }

      return (data || []) as ChatMessage[];
    },
  });

  // Subscribe to realtime
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`chat-${user.id}-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["chat-messages", user.id, otherUserId],
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, otherUserId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const sendMessage = useCallback(
    async (
      receiverId: string,
      message: string,
      imageUrl?: string | null,
      leadId?: string | null,
      appointmentId?: string | null
    ): Promise<{ success: boolean; warning?: string; blocked?: boolean }> => {
      if (!user) return { success: false };

      // Check for contact info
      if (message && containsContactInfo(message)) {
        const newCount = warningCount + 1;
        setWarningCount(newCount);

        if (newCount >= 2) {
          // Second violation - block account
          return {
            success: false,
            blocked: true,
            warning:
              "Your account has been locked for sharing contact information. Please contact customer support to unlock.",
          };
        }

        // First warning - mask and warn
        const masked = maskContactInfo(message);
        setSending(true);
        try {
          const { error } = await supabase.from("chats").insert({
            sender_id: user.id,
            receiver_id: receiverId,
            message: masked,
            image_url: imageUrl || null,
            lead_id: leadId || null,
            appointment_id: appointmentId || null,
          });
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          return {
            success: true,
            warning:
              "⚠️ Phone numbers and email addresses are not allowed in chat and have been masked. Repeated violations will result in account suspension.",
          };
        } finally {
          setSending(false);
        }
      }

      setSending(true);
      try {
        const { error } = await supabase.from("chats").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message || null,
          image_url: imageUrl || null,
          lead_id: leadId || null,
          appointment_id: appointmentId || null,
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        return { success: true };
      } finally {
        setSending(false);
      }
    },
    [user, queryClient, warningCount]
  );

  return { sendMessage, sending };
};

export const useUploadChatImage = () => {
  const { user } = useAuth();

  return useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, file);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(path);

      return publicUrl;
    },
    [user]
  );
};
