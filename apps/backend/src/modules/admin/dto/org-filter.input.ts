import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { OrgLevel, Gender } from '@prisma/client';

// Register the OrgLevel enum for GraphQL
registerEnumType(OrgLevel, {
  name: 'OrgLevel',
  description: 'Organization level in the hierarchy',
});

// Register the Gender enum for GraphQL
registerEnumType(Gender, {
  name: 'Gender',
  description: 'User gender options',
});

@InputType()
export class OrgFilterInput {
  @Field({ nullable: true })
  movementId?: string;

  @Field({ nullable: true })
  supportGroupId?: string;

  @Field(() => OrgLevel, { nullable: true })
  level?: OrgLevel;

  @Field({ nullable: true })
  countryId?: string;

  @Field({ nullable: true })
  geopoliticalZoneId?: string;

  @Field({ nullable: true })
  stateId?: string;

  @Field({ nullable: true })
  senatorialZoneId?: string;

  @Field({ nullable: true })
  federalConstituencyId?: string;

  @Field({ nullable: true })
  lgaId?: string;

  @Field({ nullable: true })
  wardId?: string;

  @Field({ nullable: true })
  pollingUnitId?: string;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;

  @Field({ nullable: true })
  profession?: string;
}
