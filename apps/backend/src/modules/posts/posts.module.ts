import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [PostsService, PostsResolver, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
