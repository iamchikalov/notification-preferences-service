import { Pool } from 'pg';
import { GlobalPolicy, NotificationType, Channel, Region } from '../types';

export class PoliciesRepository {
  constructor(private pool: Pool) {}

  async findPolicy(
    notificationType: NotificationType,
    channel: Channel,
    region: Region,
  ): Promise<GlobalPolicy | null> {
    const { rows } = await this.pool.query(
      `SELECT notification_type, channel, region, enabled
       FROM global_policies
       WHERE notification_type = $1 AND channel = $2 AND region = $3`,
      [notificationType, channel, region],
    );

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      notificationType: r.notification_type,
      channel: r.channel,
      region: r.region,
      enabled: r.enabled,
    };
  }
}
