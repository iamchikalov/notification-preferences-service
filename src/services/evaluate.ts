import { PreferencesRepository } from '../repositories/preferences';
import { PoliciesRepository } from '../repositories/policies';
import { EvaluateRequest, EvaluateResult, NotificationType } from '../types';

const QUIET_HOURS_EXEMPT: NotificationType[] = ['transactional'];

export class EvaluateService {
  constructor(
    private preferencesRepo: PreferencesRepository,
    private policiesRepo: PoliciesRepository,
  ) {}

  async evaluate(req: EvaluateRequest): Promise<EvaluateResult> {
    const policy = await this.policiesRepo.findPolicy(
      req.notificationType,
      req.channel,
      req.region,
    );
    if (policy && !policy.enabled) {
      return { decision: 'deny', reason: 'blocked_by_global_policy' };
    }

    const [defaults, overrides] = await Promise.all([
      this.preferencesRepo.getDefaults(),
      this.preferencesRepo.getUserOverrides(req.userId),
    ]);

    const override = overrides.find(
      o => o.notificationType === req.notificationType && o.channel === req.channel,
    );
    if (override) {
      if (!override.enabled) {
        return { decision: 'deny', reason: 'disabled_by_user' };
      }
    } else {
      const def = defaults.find(
        d => d.notificationType === req.notificationType && d.channel === req.channel,
      );
      if (def && !def.enabled) {
        return { decision: 'deny', reason: 'disabled_by_default' };
      }
    }

    if (!QUIET_HOURS_EXEMPT.includes(req.notificationType)) {
      const qh = await this.preferencesRepo.getQuietHours(req.userId);
      if (qh && this.isDuringQuietHours(req.datetime, qh.startTime, qh.endTime, qh.timezone)) {
        return { decision: 'deny', reason: 'blocked_by_quiet_hours' };
      }
    }

    return { decision: 'allow', reason: 'all_checks_passed' };
  }

  private isDuringQuietHours(
    datetime: string,
    startTime: string,
    endTime: string,
    timezone: string,
  ): boolean {
    const dt = new Date(datetime);
    const userTime = dt.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const current = this.timeToMinutes(userTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current < end;
    }
    // overnight range, e.g. 22:00 - 08:00
    return current >= start || current < end;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
