import { ObjectType, Field } from '@nestjs/graphql';
import { Country, State, LGA, Ward, PollingUnit } from '../../locations/entities/location.entity';

@ObjectType()
export class UserLocation {
  @Field(() => Country, { nullable: true })
  country?: Country;

  @Field(() => State, { nullable: true })
  state?: State;

  @Field(() => LGA, { nullable: true })
  lga?: LGA;

  @Field(() => Ward, { nullable: true })
  ward?: Ward;

  @Field(() => PollingUnit, { nullable: true })
  pollingUnit?: PollingUnit;
}

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  middleName?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  profession?: string;

  @Field()
  isEmailVerified: boolean;

  @Field()
  isActive: boolean;

  @Field({ defaultValue: false })
  isPlatformAdmin: boolean;

  @Field({ defaultValue: false })
  isSuspended: boolean;

  @Field({ nullable: true })
  suspendedReason?: string;

  @Field({ nullable: true })
  suspendedAt?: Date;

  @Field()
  createdAt: Date;

  @Field(() => UserLocation, { nullable: true })
  location?: UserLocation;

  @Field({ nullable: true, defaultValue: 0 })
  postCount?: number;

  @Field({ nullable: true, defaultValue: 0 })
  followerCount?: number;

  @Field({ nullable: true, defaultValue: 0 })
  followingCount?: number;

  @Field({ nullable: true, defaultValue: false })
  isFollowing?: boolean;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => User)
  user: User;
}
