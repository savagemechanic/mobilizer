import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

// Register Gender enum for GraphQL if not already registered
registerEnumType(Gender, {
  name: 'Gender',
  description: 'User gender',
});

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  middleName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profession?: string;

  @Field({ nullable: true })
  @IsOptional()
  dateOfBirth?: Date;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

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
