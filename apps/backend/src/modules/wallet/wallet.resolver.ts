import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
  OrgWallet,
  OrgTransaction,
  WalletWithTransactions,
  WalletStats,
  DisbursementResult,
  BulkDisbursementResult,
  TransactionUser,
} from './entities/wallet.entity';
import {
  FundWalletInput,
  DisbursementInput,
  BulkDisbursementInput,
  DisbursementFilterInput,
  TransactionFilterInput,
} from './dto/wallet.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class EligibleMember extends TransactionUser {
  @Field()
  membershipId: string;

  @Field()
  isVerified: boolean;

  @Field()
  isLeader: boolean;

  @Field()
  isChairman: boolean;

  @Field({ nullable: true })
  stateName?: string;

  @Field({ nullable: true })
  lgaName?: string;

  @Field({ nullable: true })
  wardName?: string;
}

@ObjectType()
class PaginatedTransactions {
  @Field(() => [OrgTransaction])
  transactions: OrgTransaction[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@Resolver()
export class WalletResolver {
  constructor(private walletService: WalletService) {}

  // ============================================
  // QUERIES
  // ============================================

  @Query(() => OrgWallet, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async orgWallet(
    @Args('orgId') orgId: string,
    @CurrentUser() user: any,
  ) {
    // Check if user can access wallet
    const canAccess = await this.walletService.canManageWallet(user.id, orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view this wallet');
    }

    return this.walletService.getOrCreateWallet(orgId);
  }

  @Query(() => WalletWithTransactions, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async orgWalletWithTransactions(
    @Args('orgId') orgId: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @CurrentUser() user: any,
  ) {
    const canAccess = await this.walletService.canManageWallet(user.id, orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view this wallet');
    }

    return this.walletService.getWalletWithTransactions(orgId, limit);
  }

  @Query(() => WalletStats)
  @UseGuards(GqlAuthGuard)
  async walletStats(
    @Args('orgId') orgId: string,
    @CurrentUser() user: any,
  ) {
    const canAccess = await this.walletService.canManageWallet(user.id, orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view wallet statistics');
    }

    return this.walletService.getWalletStats(orgId);
  }

  @Query(() => [EligibleMember])
  @UseGuards(GqlAuthGuard)
  async eligibleDisbursementMembers(
    @Args('orgId') orgId: string,
    @Args('filter', { nullable: true }) filter?: DisbursementFilterInput,
    @CurrentUser() user?: any,
  ) {
    const canAccess = await this.walletService.canManageWallet(user.id, orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to access this organization');
    }

    const members = await this.walletService.getEligibleMembers(orgId, filter);

    // Map to include location names
    return members.map((m: any) => ({
      ...m,
      stateName: m.state?.name,
      lgaName: m.lga?.name,
      wardName: m.ward?.name,
    }));
  }

  @Query(() => PaginatedTransactions)
  @UseGuards(GqlAuthGuard)
  async walletTransactions(
    @Args('filter') filter: TransactionFilterInput,
    @CurrentUser() user: any,
  ) {
    // If walletId is provided, verify access
    if (filter.walletId) {
      const wallet = await this.walletService.getWallet(filter.walletId);
      if (wallet) {
        const canAccess = await this.walletService.canManageWallet(user.id, wallet.orgId);
        if (!canAccess) {
          throw new ForbiddenException('You do not have permission to view these transactions');
        }
      }
    }

    return this.walletService.getTransactions(filter);
  }

  // ============================================
  // MUTATIONS
  // ============================================

  @Mutation(() => OrgTransaction)
  @UseGuards(GqlAuthGuard)
  async fundOrgWallet(
    @Args('input') input: FundWalletInput,
    @CurrentUser() user: any,
  ) {
    // Only super admins and platform admins can fund wallets
    const canAccess = await this.walletService.canManageWallet(user.id, input.orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to fund this wallet');
    }

    return this.walletService.fundWallet(input, user.id);
  }

  @Mutation(() => DisbursementResult)
  @UseGuards(GqlAuthGuard)
  async disburseFunds(
    @Args('input') input: DisbursementInput,
    @CurrentUser() user: any,
  ) {
    // Verify user can disburse (must be chairman or admin)
    const canAccess = await this.walletService.canManageWallet(user.id, input.orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to disburse funds');
    }

    return this.walletService.disburseToMember(input, user.id);
  }

  @Mutation(() => BulkDisbursementResult)
  @UseGuards(GqlAuthGuard)
  async bulkDisburseFunds(
    @Args('input') input: BulkDisbursementInput,
    @CurrentUser() user: any,
  ) {
    // Verify user can disburse (must be chairman or admin)
    const canAccess = await this.walletService.canManageWallet(user.id, input.orgId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to disburse funds');
    }

    return this.walletService.bulkDisburse(input, user.id);
  }
}
