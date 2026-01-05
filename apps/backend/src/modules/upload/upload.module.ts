import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadResolver } from './upload.resolver';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [UploadService, UploadResolver],
  exports: [UploadService],
})
export class UploadModule {}
