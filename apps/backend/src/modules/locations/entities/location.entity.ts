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
