import { Module } from '@nestjs/common';
import { MovementsResolver } from './movements.resolver';
import { MovementsService } from './movements.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [MovementsResolver, MovementsService, PrismaService],
  exports: [MovementsService],
})
export class MovementsModule {}
