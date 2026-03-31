import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ChatContextValue {
  isOpen: boolean;
  caseId: string | null;
  matterId: string | null;
  contextLabel: string | null;
  openChat: (options?: { caseId?: string; matterId?: string; contextLabel?: string }) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [matterId, setMatterId] = useState<string | null>(null);
  const [contextLabel, setContextLabel] = useState<string | null>(null);

  const openChat = useCallback(
    (options?: { caseId?: string; matterId?: string; contextLabel?: string }) => {
      setCaseId(options?.caseId ?? null);
      setMatterId(options?.matterId ?? null);
      setContextLabel(options?.contextLabel ?? null);
      setIsOpen(true);
    },
    []
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatContext.Provider value={{ isOpen, caseId, matterId, contextLabel, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
