import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

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
}
