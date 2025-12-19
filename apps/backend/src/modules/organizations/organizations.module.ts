import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [OrganizationsService, OrganizationsResolver, PrismaService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
