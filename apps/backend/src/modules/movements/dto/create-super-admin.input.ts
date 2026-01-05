import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

@InputType()
export class CreateSuperAdminInput {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  movementId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
