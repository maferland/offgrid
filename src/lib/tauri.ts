import { invoke } from "@tauri-apps/api/core";

export type AuthStatus = {
  connected: boolean;
  username: string | null;
  expires_at: string | null;
};

export type Mention = {
  id: string;
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  username: string;
  timestamp: string;
  seen: boolean;
};

export type PublishResult = {
  success: boolean;
  story_id: string | null;
  error: string | null;
};

export const api = {
  getAuthStatus: () => invoke<AuthStatus>("get_auth_status"),
  startOAuth: () => invoke<string>("start_oauth"),
  handleOAuthCallback: (code: string) =>
    invoke<AuthStatus>("handle_oauth_callback", { code }),
  disconnect: () => invoke<void>("disconnect"),
  publishStory: (filePath: string) =>
    invoke<PublishResult>("publish_story", { filePath }),
  getMentions: () => invoke<Mention[]>("get_mentions"),
  repostMention: (mentionId: string) =>
    invoke<PublishResult>("repost_mention", { mentionId }),
  skipMention: (mentionId: string) =>
    invoke<void>("skip_mention", { mentionId }),
  getPollingInterval: () => invoke<number>("get_polling_interval"),
  setPollingInterval: (seconds: number) =>
    invoke<void>("set_polling_interval", { seconds }),
};
