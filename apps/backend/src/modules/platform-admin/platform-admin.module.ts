import { Module } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminResolver } from './platform-admin.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [PlatformAdminService, PlatformAdminResolver, PrismaService],
  exports: [PlatformAdminService],
})
export class PlatformAdminModule {}
