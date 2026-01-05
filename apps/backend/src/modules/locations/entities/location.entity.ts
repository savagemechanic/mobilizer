import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Country {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class State {
  @Field(() => ID)
  id: string;

  @Field()
  countryId: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  createdAt: Date;

  @Field(() => Country, { nullable: true })
  country?: Country;
}

@ObjectType()
export class LGA {
  @Field(() => ID)
  id: string;

  @Field()
  stateId: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  createdAt: Date;

  @Field(() => State, { nullable: true })
  state?: State;
}

@ObjectType()
export class Ward {
  @Field(() => ID)
  id: string;

  @Field()
  lgaId: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  createdAt: Date;

  @Field(() => LGA, { nullable: true })
  lga?: LGA;
}

@ObjectType()
export class PollingUnit {
  @Field(() => ID)
  id: string;

  @Field()
  wardId: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  createdAt: Date;

  @Field(() => Ward, { nullable: true })
  ward?: Ward;
}

@ObjectType()
export class LocationLookupResult {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  error?: string;

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
export class LocationLeader {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  role?: string;
}
