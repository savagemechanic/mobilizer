import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, Matches, MaxLength, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

// Register the Gender enum for GraphQL
registerEnumType(Gender, {
  name: 'Gender',
  description: 'User gender options',
});

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  middleName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  locationCode?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must be at most 30 characters' })
  @Matches(/^[a-z0-9_]+$/, { message: 'Username can only contain lowercase letters, numbers, and underscores' })
  username: string;

  @Field(() => Gender, { nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profession?: string;
}
