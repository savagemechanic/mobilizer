import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreatePollInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  question: string;

  @Field(() => [String])
  @IsArray()
  options: string[];

  @Field({ nullable: true })
  @IsOptional()
  endsAt?: Date;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  allowMultipleVotes?: boolean;
}

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orgId?: string;

  @Field({ nullable: true, defaultValue: 'TEXT' })
  @IsOptional()
  @IsString()
  type?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @Field(() => CreatePollInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollInput)
  poll?: CreatePollInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  locationLevel?: string; // 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT'
}
