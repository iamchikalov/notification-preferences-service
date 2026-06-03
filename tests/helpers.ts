import { PreferenceEntry, QuietHoursConfig, GlobalPolicy, NotificationType, Channel, Region } from '../src/types';

const DEFAULT_PREFS: PreferenceEntry[] = [
  { notificationType: 'transactional', channel: 'email', enabled: true },
  { notificationType: 'transactional', channel: 'sms', enabled: true },
  { notificationType: 'transactional', channel: 'push', enabled: true },
  { notificationType: 'marketing', channel: 'email', enabled: false },
  { notificationType: 'marketing', channel: 'sms', enabled: false },
  { notificationType: 'marketing', channel: 'push', enabled: false },
];

export function createMockPreferencesRepo(
  overrides: PreferenceEntry[] = [],
  quietHours: QuietHoursConfig | null = null,
) {
  const userPrefs = new Map<string, Map<string, PreferenceEntry>>();
  const userQh = new Map<string, QuietHoursConfig>();

  for (const o of overrides) {
    setUserPref('test-user', o);
  }

  if (quietHours) {
    userQh.set('test-user', quietHours);
  }

  function setUserPref(userId: string, pref: PreferenceEntry) {
    if (!userPrefs.has(userId)) userPrefs.set(userId, new Map());
    const map = userPrefs.get(userId)!;
    map.set(`${pref.notificationType}:${pref.channel}`, pref);
  }

  return {
    getDefaults: async () => [...DEFAULT_PREFS],

    getUserOverrides: async (userId: string) => {
      const map = userPrefs.get(userId);
      return map ? [...map.values()] : [];
    },

    upsertPreference: async (userId: string, pref: PreferenceEntry) => {
      setUserPref(userId, pref);
    },

    getQuietHours: async (userId: string) => {
      return userQh.get(userId) ?? null;
    },

    upsertQuietHours: async (userId: string, qh: QuietHoursConfig) => {
      userQh.set(userId, qh);
    },
  };
}

export function createMockPoliciesRepo(policies: GlobalPolicy[] = []) {
  return {
    findPolicy: async (
      notificationType: NotificationType,
      channel: Channel,
      region: Region,
    ) => {
      return policies.find(
        p => p.notificationType === notificationType
          && p.channel === channel
          && p.region === region,
      ) ?? null;
    },
  };
}
