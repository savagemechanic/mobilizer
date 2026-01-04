import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class PlatformSettingsEntity {
  @Field(() => ID)
  id: string;

  @Field()
  publicOrgEnabled: boolean;

  @Field({ nullable: true })
  publicOrgId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
