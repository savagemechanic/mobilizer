import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

@InputType()
export class CreateMovementInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  banner?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;
}
