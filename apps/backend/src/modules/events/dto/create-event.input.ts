import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Field()
  @IsNotEmpty()
  type: string; // MEETING, RALLY, TOWN_HALL, etc.

  @Field()
  @IsNotEmpty()
  startTime: Date;

  @Field({ nullable: true })
  @IsOptional()
  endTime?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  virtualLink?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  banner?: string;

  @Field({ nullable: true })
  @IsOptional()
  maxAttendees?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orgId?: string;
}
