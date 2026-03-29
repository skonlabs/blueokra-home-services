import { Loader2, MessageSquare, Search } from "lucide-react";
import { useConversations, type Conversation } from "@/hooks/useChat";
import { format, isToday, isYesterday } from "date-fns";

interface ConversationListProps {
  onSelectConversation: (userId: string, name: string) => void;
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  } catch {
    return "";
  }
}

const ConversationList = ({ onSelectConversation }: ConversationListProps) => {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-3 px-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-display font-semibold text-foreground text-base">No messages yet</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Chat will appear here once you have an active booking or job
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.conversation_user_id}
          onClick={() => onSelectConversation(conv.conversation_user_id, conv.conversation_user_name)}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 active:scale-[0.99] transition-all text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {conv.conversation_user_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">
                {conv.conversation_user_name || "User"}
              </p>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                {formatTime(conv.last_message_time)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {conv.last_message || "Image"}
            </p>
          </div>
          {conv.unread_count > 0 && (
            <span className="w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
              {conv.unread_count > 9 ? "9+" : conv.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ConversationList;
