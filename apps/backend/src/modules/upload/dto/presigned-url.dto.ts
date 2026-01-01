import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PresignedUploadUrl {
  @Field()
  uploadUrl: string;

  @Field()
  fileUrl: string;

  @Field()
  key: string;
}
