import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { redactSecrets } from "@/modules/ai/security/redactSecrets";
import type {
  AISpaceAssistantResponse,
  AISpaceConversation,
  AISpaceMessage,
  AISpaceType,
} from "./types";

const conversationsKey = "pixelrises-v2-ai-space-conversations";

type AISpaceStorageSource = "supabase" | "localStorage";

type AISpaceStorageResult = {
  source: AISpaceStorageSource;
  conversations: AISpaceConversation[];
  error?: string;
};

type AISpaceSaveResult = {
  source: AISpaceStorageSource;
  conversation: AISpaceConversation;
  error?: string;
};

type DynamicSupabase = {
  auth: {
    getUser: typeof supabase.auth.getUser;
  };
  from: (table: string) => {
    select: (columns?: string) => unknown;
    upsert: (values: unknown, options?: unknown) => Promise<{ error: { message?: string } | null }>;
    insert: (values: unknown) => Promise<{ error: { message?: string } | null }>;
  };
};

const safeRead = (): AISpaceConversation[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(conversationsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (conversations: AISpaceConversation[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(conversationsKey, JSON.stringify(conversations.slice(0, 50)));
};

const makeId = (prefix: string) => {
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomId}`;
};

const dynamicSupabase = supabase as unknown as DynamicSupabase;

const getCurrentUserId = async () => {
  if (!isSupabaseConfigured || typeof window === "undefined" || import.meta.env.MODE === "test") {
    return undefined;
  }

  const { data, error } = await dynamicSupabase.auth.getUser();
  if (error || !data.user?.id) return undefined;
  return data.user.id;
};

export const getReadableAISpaceStorageError = (error: unknown) => {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : typeof error === "string"
          ? error
          : "";

  const safeMessage = redactSecrets(rawMessage);
  const normalized = safeMessage.toLowerCase();

  if (
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table") ||
    normalized.includes("relation") ||
    normalized.includes("does not exist")
  ) {
    return "Historique indisponible pour le moment. Les conversations restent en mode local tant que la synchronisation n'est pas prête.";
  }

  if (normalized.includes("row-level security") || normalized.includes("rls")) {
    return "Historique indisponible pour le moment. La sauvegarde reste locale tant que la synchronisation cloud n'est pas validée.";
  }

  if (normalized.includes("jwt") || normalized.includes("auth") || normalized.includes("session")) {
    return "Historique indisponible pour le moment. Connecte-toi pour synchroniser les conversations, sinon le mode local reste actif.";
  }

  return "Historique indisponible pour le moment. Les conversations restent en mode local sans exposer de détail technique.";
};

export const readAISpaceConversations = (spaceType?: AISpaceType) => {
  const conversations = safeRead().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return spaceType ? conversations.filter((conversation) => conversation.spaceType === spaceType) : conversations;
};

export const createAISpaceMessage = (
  role: AISpaceMessage["role"],
  content: string,
  source?: AISpaceMessage["source"],
): AISpaceMessage => ({
  id: makeId("msg"),
  role,
  content,
  source,
  createdAt: new Date().toISOString(),
});

export const loadAISpaceConversations = async (spaceType?: AISpaceType): Promise<AISpaceStorageResult> => {
  const localConversations = readAISpaceConversations(spaceType);
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      source: "localStorage",
      conversations: localConversations,
    };
  }

  try {
    let conversationQuery = dynamicSupabase
      .from("ai_space_conversations")
      .select("*") as {
        eq: (column: string, value: string) => unknown;
      };

    conversationQuery = conversationQuery.eq("user_id", userId) as typeof conversationQuery;
    if (spaceType) {
      conversationQuery = conversationQuery.eq("space_type", spaceType) as typeof conversationQuery;
    }

    const { data: conversationRows, error: conversationError } = (await (
      conversationQuery as {
        order: (
          column: string,
          options?: { ascending?: boolean },
        ) => { limit: (count: number) => Promise<{ data: unknown[] | null; error: { message?: string } | null }> };
      }
    )
      .order("updated_at", { ascending: false })
      .limit(20)) as { data: unknown[] | null; error: { message?: string } | null };

    if (conversationError || !conversationRows) {
      return {
        source: "localStorage",
        conversations: localConversations,
        error: getReadableAISpaceStorageError(conversationError?.message ?? "Conversations AI Spaces indisponibles."),
      };
    }

    const conversationIds = conversationRows
      .map((row) => (row as { id?: unknown }).id)
      .filter((id): id is string => typeof id === "string");

    const messagesByConversation = new Map<string, AISpaceMessage[]>();

    if (conversationIds.length > 0) {
      const { data: messageRows, error: messageError } = (await (
        dynamicSupabase.from("ai_space_messages").select("*") as {
          eq: (column: string, value: string) => {
            in: (
              column: string,
              values: string[],
            ) => {
              order: (
                column: string,
                options?: { ascending?: boolean },
              ) => Promise<{ data: unknown[] | null; error: { message?: string } | null }>;
            };
          };
        }
      )
        .eq("user_id", userId)
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true })) as {
        data: unknown[] | null;
        error: { message?: string } | null;
      };

      if (!messageError && Array.isArray(messageRows)) {
        messageRows.forEach((row) => {
          const message = row as {
            id?: unknown;
            conversation_id?: unknown;
            role?: unknown;
            content?: unknown;
            source?: unknown;
            created_at?: unknown;
          };
          const conversationId = typeof message.conversation_id === "string" ? message.conversation_id : "";
          if (!conversationId) return;

          const nextMessage: AISpaceMessage = {
            id: typeof message.id === "string" ? message.id : makeId("msg"),
            role:
              message.role === "user" || message.role === "assistant" || message.role === "system"
                ? message.role
                : "assistant",
            content: typeof message.content === "string" ? message.content : "",
            source: message.source === "real" ? "real" : "mock-fallback",
            createdAt: typeof message.created_at === "string" ? message.created_at : new Date().toISOString(),
          };

          messagesByConversation.set(conversationId, [
            ...(messagesByConversation.get(conversationId) ?? []),
            nextMessage,
          ]);
        });
      }
    }

    const conversations = conversationRows.map((row) => {
      const conversation = row as {
        id?: unknown;
        space_type?: unknown;
        title?: unknown;
        created_at?: unknown;
        updated_at?: unknown;
      };
      const id = typeof conversation.id === "string" ? conversation.id : makeId("conv");

      return {
        id,
        spaceType: conversation.space_type as AISpaceType,
        title: typeof conversation.title === "string" ? conversation.title : "Nouvelle conversation",
        messages: messagesByConversation.get(id) ?? [],
        createdAt: typeof conversation.created_at === "string" ? conversation.created_at : new Date().toISOString(),
        updatedAt: typeof conversation.updated_at === "string" ? conversation.updated_at : new Date().toISOString(),
      };
    });

    return {
      source: "supabase",
      conversations,
    };
  } catch (error) {
    return {
      source: "localStorage",
      conversations: localConversations,
      error: getReadableAISpaceStorageError(error),
    };
  }
};

export const saveAISpaceConversationTurn = (
  spaceType: AISpaceType,
  conversationId: string | undefined,
  titleSeed: string,
  messages: AISpaceMessage[],
) => {
  const now = new Date().toISOString();
  const conversations = safeRead();
  const existing = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId)
    : undefined;

  const title = existing?.title || titleSeed.trim().slice(0, 70) || "Nouvelle conversation";
  const nextConversation: AISpaceConversation = {
    id: existing?.id || makeId("conv"),
    spaceType,
    title,
    messages: [...(existing?.messages ?? []), ...messages].slice(-40),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  safeWrite([
    nextConversation,
    ...conversations.filter((conversation) => conversation.id !== nextConversation.id),
  ]);

  return nextConversation;
};

export const saveAISpaceConversationTurnPersistent = async (
  spaceType: AISpaceType,
  conversationId: string | undefined,
  titleSeed: string,
  messages: AISpaceMessage[],
): Promise<AISpaceSaveResult> => {
  const conversation = saveAISpaceConversationTurn(spaceType, conversationId, titleSeed, messages);
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      source: "localStorage",
      conversation,
    };
  }

  try {
    const conversationPayload = {
      id: conversation.id,
      user_id: userId,
      space_type: spaceType,
      title: conversation.title,
      metadata: {},
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
    };

    const { error: conversationError } = await dynamicSupabase
      .from("ai_space_conversations")
      .upsert(conversationPayload, { onConflict: "id" });

    if (conversationError) {
      return {
        source: "localStorage",
        conversation,
        error: getReadableAISpaceStorageError(conversationError.message ?? "Conversation AI Space non synchronisee."),
      };
    }

    const messagePayloads = messages.map((message) => ({
      id: message.id,
      conversation_id: conversation.id,
      user_id: userId,
      role: message.role,
      content: message.content,
      source: message.source ?? "mock-fallback",
      metadata: {},
      created_at: message.createdAt,
    }));

    if (messagePayloads.length > 0) {
      const { error: messageError } = await dynamicSupabase
        .from("ai_space_messages")
        .upsert(messagePayloads, { onConflict: "id" });

      if (messageError) {
        return {
          source: "localStorage",
          conversation,
          error: getReadableAISpaceStorageError(messageError.message ?? "Messages AI Space non synchronises."),
        };
      }
    }

    return {
      source: "supabase",
      conversation,
    };
  } catch (error) {
    return {
      source: "localStorage",
      conversation,
      error: getReadableAISpaceStorageError(error),
    };
  }
};

export const saveAISpaceUsageLog = async (params: {
  spaceType: AISpaceType;
  conversationId?: string;
  response: AISpaceAssistantResponse;
  durationMs: number;
}) => {
  const userId = await getCurrentUserId();
  if (!userId) return { source: "localStorage" as const };

  try {
    const { error } = await dynamicSupabase.from("ai_space_usage_logs").insert({
      user_id: userId,
      conversation_id: params.conversationId ?? null,
      space_type: params.spaceType,
      provider: params.response.provider ?? "",
      model: params.response.model ?? "",
      source: params.response.source,
      estimated_tokens: params.response.usage?.estimatedTokens ?? 0,
      estimated_cost: params.response.usage?.estimatedCost ?? 0,
      duration_ms: params.durationMs,
      success: params.response.success,
      error_message: params.response.error ?? null,
    });

    return error
      ? { source: "localStorage" as const, error: getReadableAISpaceStorageError(error.message ?? "Usage AI Space non journalise.") }
      : { source: "supabase" as const };
  } catch (error) {
    return { source: "localStorage" as const, error: getReadableAISpaceStorageError(error) };
  }
};
