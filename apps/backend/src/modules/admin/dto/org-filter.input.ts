import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { OrgLevel } from '@prisma/client';

// Register the OrgLevel enum for GraphQL
registerEnumType(OrgLevel, {
  name: 'OrgLevel',
  description: 'Organization level in the hierarchy',
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
  stateId?: string;

  @Field({ nullable: true })
  lgaId?: string;

  @Field({ nullable: true })
  wardId?: string;

  @Field({ nullable: true })
  pollingUnitId?: string;
}
