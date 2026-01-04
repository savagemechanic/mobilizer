import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType('FeedFilterInput')
export class FeedFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orgId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  countryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stateId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lgaId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  wardId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pollingUnitId?: string;
}
