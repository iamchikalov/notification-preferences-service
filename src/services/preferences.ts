import { PreferencesRepository } from '../repositories/preferences';
import { PreferenceEntry, QuietHoursConfig, UserPreferences } from '../types';

export class PreferencesService {
  constructor(private repo: PreferencesRepository) {}

  async get(userId: string): Promise<UserPreferences> {
    const [defaults, overrides, quietHours] = await Promise.all([
      this.repo.getDefaults(),
      this.repo.getUserOverrides(userId),
      this.repo.getQuietHours(userId),
    ]);

    const overrideMap = new Map(
      overrides.map(o => [`${o.notificationType}:${o.channel}`, o]),
    );

    const merged = defaults.map(d => {
      const key = `${d.notificationType}:${d.channel}`;
      return overrideMap.get(key) ?? d;
    });

    return { userId, preferences: merged, quietHours };
  }

  async update(
    userId: string,
    preferences?: PreferenceEntry[],
    quietHours?: QuietHoursConfig,
  ): Promise<void> {
    if (preferences) {
      for (const pref of preferences) {
        await this.repo.upsertPreference(userId, pref);
      }
    }

    if (quietHours) {
      await this.repo.upsertQuietHours(userId, quietHours);
    }
  }
}
