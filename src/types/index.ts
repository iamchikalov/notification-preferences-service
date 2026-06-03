export type NotificationType = 'transactional' | 'marketing';
export type Channel = 'email' | 'sms' | 'push';
export type Region = 'EU' | 'US' | 'APAC';

export interface PreferenceEntry {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface QuietHoursConfig {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  timezone: string;
}

export interface UserPreferences {
  userId: string;
  preferences: PreferenceEntry[];
  quietHours: QuietHoursConfig | null;
}

export interface EvaluateRequest {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: string; // ISO 8601
}

export interface EvaluateResult {
  decision: 'allow' | 'deny';
  reason: string;
}

export interface GlobalPolicy {
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  enabled: boolean;
}
