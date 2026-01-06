import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { LeaderLevel } from '@prisma/client';

// Register the enum with GraphQL
registerEnumType(LeaderLevel, {
  name: 'LeaderLevel',
  description: 'Leadership level in geographic hierarchy',
});

@InputType()
export class MakeLeaderInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  membershipId: string;

  @Field(() => LeaderLevel)
  @IsEnum(LeaderLevel)
  level: LeaderLevel;

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

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isChairman?: boolean;
}
