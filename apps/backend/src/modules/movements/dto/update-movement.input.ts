import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsUrl, IsBoolean } from 'class-validator';

@InputType()
export class UpdateMovementInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
