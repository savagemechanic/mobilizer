import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { WalletStatus, TransactionType, TransactionStatus } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(WalletStatus, {
  name: 'WalletStatus',
  description: 'Wallet status',
});

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'Transaction type',
});

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
  description: 'Transaction status',
});

@ObjectType()
export class WalletOrganization {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  logo?: string;
}

@ObjectType()
export class OrgWallet {
  @Field(() => ID)
  id: string;

  @Field()
  orgId: string;

  @Field(() => Float)
  balance: number;

  @Field(() => Float)
  ledgerBalance: number;

  @Field(() => WalletStatus)
  status: WalletStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => WalletOrganization, { nullable: true })
  organization?: WalletOrganization;
}

@ObjectType()
export class TransactionUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  phoneNumber?: string;
}

@ObjectType()
export class OrgTransaction {
  @Field(() => ID)
  id: string;

  @Field()
  walletId: string;

  @Field(() => TransactionType)
  type: TransactionType;

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  balanceBefore: number;

  @Field(() => Float)
  balanceAfter: number;

  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field()
  reference: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  recipientUserId?: string;

  @Field(() => TransactionUser, { nullable: true })
  recipient?: TransactionUser;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class WalletWithTransactions extends OrgWallet {
  @Field(() => [OrgTransaction])
  transactions: OrgTransaction[];
}

@ObjectType()
export class WalletStats {
  @Field(() => Float)
  totalFunded: number;

  @Field(() => Float)
  totalDisbursed: number;

  @Field(() => Float)
  currentBalance: number;

  @Field()
  transactionCount: number;

  @Field()
  disbursementCount: number;
}

@ObjectType()
export class DisbursementResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => OrgTransaction, { nullable: true })
  transaction?: OrgTransaction;
}

@ObjectType()
export class BulkDisbursementResult {
  @Field()
  totalRequested: number;

  @Field()
  successful: number;

  @Field()
  failed: number;

  @Field(() => Float)
  totalAmountDisbursed: number;

  @Field(() => [DisbursementResult])
  results: DisbursementResult[];
}
