import { OmitType } from '@nestjs/swagger';
import { OrganizationMonthlyReportQueryDto } from './organization-monthly-report-query.dto';

export class OrganizationMonthlyReportExcelQueryDto extends OmitType(
  OrganizationMonthlyReportQueryDto,
  ['page', 'limit'] as const,
) {}
