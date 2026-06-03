import { describe, it, expect } from 'vitest';
import { EvaluateService } from '../src/services/evaluate';
import { createMockPreferencesRepo, createMockPoliciesRepo } from './helpers';

describe('EvaluateService', () => {
  it('allows transactional email for a new user', async () => {
    const prefsRepo = createMockPreferencesRepo();
    const policiesRepo = createMockPoliciesRepo();
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'new-user',
      notificationType: 'transactional',
      channel: 'email',
      region: 'US',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result.decision).toBe('allow');
  });

  it('denies marketing email by default', async () => {
    const prefsRepo = createMockPreferencesRepo();
    const policiesRepo = createMockPoliciesRepo();
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'new-user',
      notificationType: 'marketing',
      channel: 'email',
      region: 'US',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('disabled_by_default');
  });

  it('denies when user has disabled the notification type', async () => {
    const prefsRepo = createMockPreferencesRepo([
      { notificationType: 'transactional', channel: 'sms', enabled: false },
    ]);
    const policiesRepo = createMockPoliciesRepo();
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'test-user',
      notificationType: 'transactional',
      channel: 'sms',
      region: 'US',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('disabled_by_user');
  });

  it('denies marketing push during quiet hours', async () => {
    const prefsRepo = createMockPreferencesRepo(
      [{ notificationType: 'marketing', channel: 'push', enabled: true }],
      { startTime: '22:00', endTime: '08:00', timezone: 'Europe/Moscow' },
    );
    const policiesRepo = createMockPoliciesRepo();
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    // 23:30 Moscow time (20:30 UTC)
    const result = await service.evaluate({
      userId: 'test-user',
      notificationType: 'marketing',
      channel: 'push',
      region: 'US',
      datetime: '2026-05-21T20:30:00Z',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('blocked_by_quiet_hours');
  });

  it('allows transactional notifications during quiet hours', async () => {
    const prefsRepo = createMockPreferencesRepo(
      [],
      { startTime: '22:00', endTime: '08:00', timezone: 'Europe/Moscow' },
    );
    const policiesRepo = createMockPoliciesRepo();
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'test-user',
      notificationType: 'transactional',
      channel: 'email',
      region: 'US',
      datetime: '2026-05-21T23:30:00Z',
    });

    expect(result.decision).toBe('allow');
  });

  it('denies when blocked by global policy', async () => {
    const prefsRepo = createMockPreferencesRepo([
      { notificationType: 'marketing', channel: 'sms', enabled: true },
    ]);
    const policiesRepo = createMockPoliciesRepo([
      { notificationType: 'marketing', channel: 'sms', region: 'EU', enabled: false },
    ]);
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'test-user',
      notificationType: 'marketing',
      channel: 'sms',
      region: 'EU',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('blocked_by_global_policy');
  });

  it('global policy takes precedence over user preferences', async () => {
    const prefsRepo = createMockPreferencesRepo([
      { notificationType: 'marketing', channel: 'sms', enabled: true },
    ]);
    const policiesRepo = createMockPoliciesRepo([
      { notificationType: 'marketing', channel: 'sms', region: 'EU', enabled: false },
    ]);
    const service = new EvaluateService(prefsRepo as any, policiesRepo as any);

    const result = await service.evaluate({
      userId: 'test-user',
      notificationType: 'marketing',
      channel: 'sms',
      region: 'EU',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('blocked_by_global_policy');

    // same request but different region — should be allowed
    const result2 = await service.evaluate({
      userId: 'test-user',
      notificationType: 'marketing',
      channel: 'sms',
      region: 'US',
      datetime: '2026-05-21T14:00:00Z',
    });

    expect(result2.decision).toBe('allow');
  });
});
