import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AuditModule is a Global module that provides audit logging functionality
 * throughout the application. It can be injected anywhere without importing.
 */
@Global()
@Module({
  providers: [AuditService, AuditResolver, AuditInterceptor, PrismaService],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
