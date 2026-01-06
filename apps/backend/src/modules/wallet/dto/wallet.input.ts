import { InputType, Field, Float } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsPositive, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class FundWalletInput {
  @Field()
  @IsUUID()
  orgId: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class DisbursementInput {
  @Field()
  @IsUUID()
  orgId: string;

  @Field()
  @IsUUID()
  recipientUserId: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class BulkDisbursementRecipient {
  @Field()
  @IsUUID()
  userId: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class BulkDisbursementInput {
  @Field()
  @IsUUID()
  orgId: string;

  @Field(() => [BulkDisbursementRecipient])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkDisbursementRecipient)
  recipients: BulkDisbursementRecipient[];
}

@InputType()
export class DisbursementFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  orgId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  lgaId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  pollingUnitId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  geopoliticalZoneId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  senatorialZoneId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  federalConstituencyId?: string;

  @Field({ nullable: true })
  @IsOptional()
  verifiedOnly?: boolean;
}

@InputType()
export class TransactionFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  walletId?: string;

  @Field({ nullable: true })
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: Date;

  @Field({ nullable: true, defaultValue: 1 })
  @IsOptional()
  page?: number;

  @Field({ nullable: true, defaultValue: 20 })
  @IsOptional()
  limit?: number;
}
