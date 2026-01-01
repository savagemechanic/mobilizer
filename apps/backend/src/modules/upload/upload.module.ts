import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { UploadResolver } from './upload.resolver';

@Module({
  imports: [ConfigModule],
  providers: [UploadService, UploadResolver],
  exports: [UploadService],
})
export class UploadModule {}
