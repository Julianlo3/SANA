import { Injectable } from '@nestjs/common';
import {
  ReportsRepository,
  type ReportsSummary,
} from './reports.repository.js';

/** Provides aggregated reports without exposing personal or clinical data. */
@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  getSummary(): Promise<ReportsSummary> {
    return this.reportsRepository.getSummary();
  }
}
