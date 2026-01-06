import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { OrgLevel, LeaderLevel } from '@prisma/client';

registerEnumType(OrgLevel, {
  name: 'OrgLevel',
  description: 'Organization level in hierarchy',
});

registerEnumType(LeaderLevel, {
  name: 'LeaderLevel',
  description: 'Leadership level in geographic hierarchy',
});

@ObjectType()
export class OrganizationEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  banner?: string;

  @Field(() => OrgLevel)
  level: OrgLevel;

  @Field({ nullable: true })
  movementId?: string;

  @Field({ nullable: true })
  parentId?: string;

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

  @Field()
  memberCount: number;

  @Field({ nullable: true })
  inviteCode?: string;

  @Field()
  isVerified: boolean;

  @Field()
  isActive: boolean;

  @Field()
  isPrivate: boolean;

  @Field()
  requiresConfirmation: boolean;

  @Field(() => [String])
  enabledLocationLevels: string[];

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class MemberUser {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class MemberOrg {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => OrgLevel)
  level: OrgLevel;
}

@ObjectType()
export class OrganizationWithJoinDate extends OrganizationEntity {
  @Field({ nullable: true })
  joinedAt?: Date;
}

@ObjectType()
export class OrganizationsForSelector {
  @Field(() => [OrganizationWithJoinDate])
  organizations: OrganizationWithJoinDate[];

  @Field(() => OrganizationEntity, { nullable: true })
  publicOrg?: OrganizationEntity;

  @Field()
  publicOrgEnabled: boolean;

  @Field()
  showAllOrgsOption: boolean;
}

@ObjectType()
export class OrgMembershipEntity {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  orgId: string;

  @Field()
  isAdmin: boolean;

  @Field()
  isActive: boolean;

  @Field()
  joinedAt: Date;

  @Field({ nullable: true })
  approvedAt?: Date;

  // Leader fields
  @Field()
  isLeader: boolean;

  @Field()
  isChairman: boolean;

  @Field(() => LeaderLevel, { nullable: true })
  leaderLevel?: LeaderLevel;

  @Field({ nullable: true })
  leaderStateId?: string;

  @Field({ nullable: true })
  leaderLgaId?: string;

  @Field({ nullable: true })
  leaderWardId?: string;

  @Field({ nullable: true })
  leaderPollingUnitId?: string;

  @Field({ nullable: true })
  leaderAssignedAt?: Date;

  @Field({ nullable: true })
  leaderAssignedBy?: string;

  @Field(() => MemberUser, { nullable: true })
  user?: MemberUser;

  @Field(() => MemberOrg, { nullable: true })
  organization?: MemberOrg;
}
