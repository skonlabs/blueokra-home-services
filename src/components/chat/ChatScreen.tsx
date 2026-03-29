import { useState } from "react";
import ConversationList from "./ConversationList";
import ChatThread from "./ChatThread";

interface ChatScreenProps {
  initialUserId?: string;
  initialUserName?: string;
}

const ChatScreen = ({ initialUserId, initialUserName }: ChatScreenProps) => {
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(
    initialUserId && initialUserName ? { id: initialUserId, name: initialUserName } : null
  );

  if (selectedUser) {
    return (
      <ChatThread
        otherUserId={selectedUser.id}
        otherUserName={selectedUser.name}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <ConversationList
      onSelectConversation={(id, name) => setSelectedUser({ id, name })}
    />
  );
};

export default ChatScreen;
