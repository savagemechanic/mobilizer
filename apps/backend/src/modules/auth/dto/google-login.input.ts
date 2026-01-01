import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class GoogleLoginInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  googleId: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;
}
