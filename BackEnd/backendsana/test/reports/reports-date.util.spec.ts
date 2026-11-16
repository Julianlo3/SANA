import { describe, expect, it } from 'vitest';
import { ReportPreset } from '../../src/reports/dto/report-presets.enum.js';
import {
  compareMetrics,
  maskEmail,
  resolveReportDateRange,
} from '../../src/reports/reports-date.util.js';

describe('reports-date.util', () => {
  describe('resolveReportDateRange', () => {
    it('resolves preset today correctly', () => {
      const range = resolveReportDateRange({ preset: ReportPreset.Today });
      expect(range.preset).toBe(ReportPreset.Today);
      expect(range.startDate.getTime()).toBeLessThanOrEqual(
        range.endDate.getTime(),
      );
      expect(range.previousStartDate.getTime()).toBeLessThan(
        range.startDate.getTime(),
      );
    });

    it('resolves preset last_7_days correctly', () => {
      const range = resolveReportDateRange({ preset: ReportPreset.Last7Days });
      expect(range.preset).toBe(ReportPreset.Last7Days);
      const diffDays = Math.round(
        (range.endDate.getTime() - range.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(7);
    });

    it('resolves custom date ranges correctly', () => {
      const range = resolveReportDateRange({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });
      expect(range.preset).toBe(ReportPreset.Custom);
      expect(range.periodLabel).toBe('2026-10-01 al 2026-10-31');
      expect(range.previousEndDate.getTime()).toBeLessThan(
        range.startDate.getTime(),
      );
    });

    it('swaps dates if startDate > endDate', () => {
      const range = resolveReportDateRange({
        startDate: '2026-11-15',
        endDate: '2026-11-01',
      });
      expect(range.startDate.getTime()).toBeLessThanOrEqual(
        range.endDate.getTime(),
      );
    });

    it('defaults to last_month when no query parameters are provided', () => {
      const range = resolveReportDateRange({});
      expect(range.preset).toBe(ReportPreset.LastMonth);
    });
  });

  describe('compareMetrics', () => {
    it('calculates positive variation correctly', () => {
      const comparison = compareMetrics(150, 100);
      expect(comparison).toEqual({
        current: 150,
        previous: 100,
        difference: 50,
        percentage: 50,
      });
    });

    it('calculates negative variation correctly', () => {
      const comparison = compareMetrics(80, 100);
      expect(comparison).toEqual({
        current: 80,
        previous: 100,
        difference: -20,
        percentage: -20,
      });
    });

    it('returns null percentage when previous is 0 and current > 0', () => {
      const comparison = compareMetrics(10, 0);
      expect(comparison).toEqual({
        current: 10,
        previous: 0,
        difference: 10,
        percentage: null,
      });
    });

    it('returns 0 percentage when both current and previous are 0', () => {
      const comparison = compareMetrics(0, 0);
      expect(comparison).toEqual({
        current: 0,
        previous: 0,
        difference: 0,
        percentage: 0,
      });
    });
  });

  describe('maskEmail', () => {
    it('masks regular email addresses properly', () => {
      expect(maskEmail('juan.perez@example.com')).toBe('j********z@example.com');
    });

    it('handles short usernames properly', () => {
      expect(maskEmail('ab@test.com')).toBe('a*@test.com');
    });

    it('returns null for null or empty input', () => {
      expect(maskEmail(null)).toBeNull();
      expect(maskEmail('')).toBeNull();
    });

    it('returns *** for invalid email', () => {
      expect(maskEmail('invalid-email')).toBe('***');
    });
  });
});
