import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UploadService, UploadType } from './upload.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PresignedUploadUrl } from './dto/presigned-url.dto';

@Resolver()
export class UploadResolver {
  constructor(private uploadService: UploadService) {}

  @Query(() => Boolean)
  uploadConfigured(): boolean {
    return this.uploadService.isConfigured();
  }

  @Mutation(() => PresignedUploadUrl)
  @UseGuards(GqlAuthGuard)
  async getPresignedUploadUrl(
    @CurrentUser() user: any,
    @Args('type') type: string,
    @Args('fileName') fileName: string,
    @Args('contentType') contentType: string,
  ): Promise<PresignedUploadUrl> {
    const validTypes: UploadType[] = ['avatar', 'post', 'organization', 'event'];
    const uploadType = validTypes.includes(type as UploadType)
      ? (type as UploadType)
      : 'avatar';

    return this.uploadService.getPresignedUploadUrl(
      user.id,
      uploadType,
      fileName,
      contentType,
    );
  }
}
