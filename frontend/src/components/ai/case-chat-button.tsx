import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat-context";
import { es } from "@/i18n/es";
import { Bot } from "lucide-react";

interface CaseChatButtonProps {
  caseId?: string;
  matterId?: string;
  contextLabel: string;
}

export function CaseChatButton({ caseId, matterId, contextLabel }: CaseChatButtonProps) {
  const { openChat } = useChat();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openChat({ caseId, matterId, contextLabel })}
    >
      <Bot className="mr-2 h-4 w-4" />
      {es.ai.consultAI}
    </Button>
  );
}
