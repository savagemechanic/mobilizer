import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class GenderBreakdown {
  @Field(() => Int)
  male: number;

  @Field(() => Int)
  female: number;

  @Field(() => Int)
  other: number;

  @Field(() => Int)
  notSpecified: number;
}

@ObjectType()
export class AgeGroup {
  @Field()
  range: string; // "18-24", "25-34", etc.

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class LocationStat {
  @Field()
  name: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ProfessionStat {
  @Field()
  profession: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class GeopoliticalZoneStat {
  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class MemberAnalytics {
  @Field(() => GenderBreakdown)
  genderBreakdown: GenderBreakdown;

  @Field(() => [AgeGroup])
  ageBreakdown: AgeGroup[];

  @Field(() => [LocationStat])
  locationBreakdown: LocationStat[];

  @Field(() => [ProfessionStat])
  professionBreakdown: ProfessionStat[];

  @Field(() => [GeopoliticalZoneStat])
  geopoliticalZoneBreakdown: GeopoliticalZoneStat[];
}
