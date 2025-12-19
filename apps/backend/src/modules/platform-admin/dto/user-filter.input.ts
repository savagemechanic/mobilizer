import { InputType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class UserFilterInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  search?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isSuspended?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  isPlatformAdmin?: boolean;
}
