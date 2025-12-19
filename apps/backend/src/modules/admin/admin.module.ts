import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Module({
  providers: [AdminService, AdminResolver, PrismaService, SuperAdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
