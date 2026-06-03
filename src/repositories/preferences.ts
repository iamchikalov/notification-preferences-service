import { Pool } from 'pg';
import { PreferenceEntry, QuietHoursConfig } from '../types';

export class PreferencesRepository {
  constructor(private pool: Pool) {}

  async getDefaults(): Promise<PreferenceEntry[]> {
    const { rows } = await this.pool.query(
      'SELECT notification_type, channel, enabled FROM default_preferences',
    );
    return rows.map(r => ({
      notificationType: r.notification_type,
      channel: r.channel,
      enabled: r.enabled,
    }));
  }

  async getUserOverrides(userId: string): Promise<PreferenceEntry[]> {
    const { rows } = await this.pool.query(
      'SELECT notification_type, channel, enabled FROM user_preferences WHERE user_id = $1',
      [userId],
    );
    return rows.map(r => ({
      notificationType: r.notification_type,
      channel: r.channel,
      enabled: r.enabled,
    }));
  }

  async upsertPreference(userId: string, pref: PreferenceEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_preferences (user_id, notification_type, channel, enabled, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, notification_type, channel)
       DO UPDATE SET enabled = $4, updated_at = now()`,
      [userId, pref.notificationType, pref.channel, pref.enabled],
    );
  }

  async getQuietHours(userId: string): Promise<QuietHoursConfig | null> {
    const { rows } = await this.pool.query(
      'SELECT start_time, end_time, timezone FROM quiet_hours WHERE user_id = $1',
      [userId],
    );
    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      startTime: r.start_time.slice(0, 5), // "22:00:00" -> "22:00"
      endTime: r.end_time.slice(0, 5),
      timezone: r.timezone,
    };
  }

  async upsertQuietHours(userId: string, qh: QuietHoursConfig): Promise<void> {
    await this.pool.query(
      `INSERT INTO quiet_hours (user_id, start_time, end_time, timezone, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id)
       DO UPDATE SET start_time = $2, end_time = $3, timezone = $4, updated_at = now()`,
      [userId, qh.startTime, qh.endTime, qh.timezone],
    );
  }
}
