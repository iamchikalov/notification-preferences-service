import { describe, it, expect } from 'vitest';
import { PreferencesService } from '../src/services/preferences';
import { createMockPreferencesRepo } from './helpers';

describe('PreferencesService', () => {
  it('returns default preferences for a new user', async () => {
    const repo = createMockPreferencesRepo();
    const service = new PreferencesService(repo as any);

    const result = await service.get('new-user');

    expect(result.userId).toBe('new-user');
    expect(result.quietHours).toBeNull();

    const transactionalEmail = result.preferences.find(
      p => p.notificationType === 'transactional' && p.channel === 'email',
    );
    expect(transactionalEmail?.enabled).toBe(true);

    const marketingEmail = result.preferences.find(
      p => p.notificationType === 'marketing' && p.channel === 'email',
    );
    expect(marketingEmail?.enabled).toBe(false);
  });

  it('reflects user preference changes without affecting others', async () => {
    const repo = createMockPreferencesRepo();
    const service = new PreferencesService(repo as any);

    await service.update('user-1', [
      { notificationType: 'marketing', channel: 'email', enabled: true },
    ]);

    const result = await service.get('user-1');

    const marketingEmail = result.preferences.find(
      p => p.notificationType === 'marketing' && p.channel === 'email',
    );
    expect(marketingEmail?.enabled).toBe(true);

    const transactionalEmail = result.preferences.find(
      p => p.notificationType === 'transactional' && p.channel === 'email',
    );
    expect(transactionalEmail?.enabled).toBe(true);

    const marketingSms = result.preferences.find(
      p => p.notificationType === 'marketing' && p.channel === 'sms',
    );
    expect(marketingSms?.enabled).toBe(false);
  });

  it('is idempotent when applying the same change twice', async () => {
    const repo = createMockPreferencesRepo();
    const service = new PreferencesService(repo as any);

    const change = [{ notificationType: 'marketing' as const, channel: 'email' as const, enabled: false }];

    await service.update('user-1', change);
    const first = await service.get('user-1');

    await service.update('user-1', change);
    const second = await service.get('user-1');

    expect(first.preferences).toEqual(second.preferences);
  });

  it('stores and retrieves quiet hours', async () => {
    const repo = createMockPreferencesRepo();
    const service = new PreferencesService(repo as any);

    await service.update('user-1', undefined, {
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'Europe/Moscow',
    });

    const result = await service.get('user-1');
    expect(result.quietHours).toEqual({
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'Europe/Moscow',
    });
  });
});
