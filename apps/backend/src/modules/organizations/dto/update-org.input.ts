import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

@InputType()
export class UpdateOrgInput {
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
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  banner?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  enabledLocationLevels?: string[];
}
