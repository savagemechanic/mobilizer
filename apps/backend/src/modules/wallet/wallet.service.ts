import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, TransactionStatus, WalletStatus } from '@prisma/client';
import {
  FundWalletInput,
  DisbursementInput,
  BulkDisbursementInput,
  DisbursementFilterInput,
  TransactionFilterInput,
} from './dto/wallet.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique transaction reference
   */
  private generateReference(): string {
    return `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  /**
   * Get or create wallet for an organization
   */
  async getOrCreateWallet(orgId: string) {
    let wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
      include: {
        organization: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.orgWallet.create({
        data: { orgId },
        include: {
          organization: {
            select: { id: true, name: true, logo: true },
          },
        },
      });
    }

    return wallet;
  }

  /**
   * Get wallet by organization ID
   */
  async getWallet(orgId: string) {
    return this.prisma.orgWallet.findUnique({
      where: { orgId },
      include: {
        organization: {
          select: { id: true, name: true, logo: true },
        },
      },
    });
  }

  /**
   * Get wallet with recent transactions
   */
  async getWalletWithTransactions(orgId: string, limit = 20) {
    const wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
      include: {
        organization: {
          select: { id: true, name: true, logo: true },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            wallet: {
              include: {
                organization: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Fetch recipient details for disbursement transactions
    const transactionsWithRecipients = await Promise.all(
      wallet.transactions.map(async (tx) => {
        if (tx.recipientUserId) {
          const recipient = await this.prisma.user.findUnique({
            where: { id: tx.recipientUserId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true,
              phoneNumber: true,
            },
          });
          return { ...tx, recipient };
        }
        return tx;
      }),
    );

    return {
      ...wallet,
      transactions: transactionsWithRecipients,
    };
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(orgId: string) {
    const wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
    });

    if (!wallet) {
      return {
        totalFunded: 0,
        totalDisbursed: 0,
        currentBalance: 0,
        transactionCount: 0,
        disbursementCount: 0,
      };
    }

    const [fundingAgg, disbursementAgg, transactionCount] = await Promise.all([
      this.prisma.orgTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.orgTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          status: TransactionStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.orgTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    const disbursementCount = await this.prisma.orgTransaction.count({
      where: {
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        recipientUserId: { not: null },
        status: TransactionStatus.COMPLETED,
      },
    });

    return {
      totalFunded: Number(fundingAgg._sum.amount || 0),
      totalDisbursed: Number(disbursementAgg._sum.amount || 0),
      currentBalance: Number(wallet.balance),
      transactionCount,
      disbursementCount,
    };
  }

  /**
   * Fund an organization's wallet (Super Admin or Platform Admin only)
   */
  async fundWallet(input: FundWalletInput, fundedBy: string) {
    const { orgId, amount, description } = input;

    // Get or create the wallet
    const wallet = await this.getOrCreateWallet(orgId);

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('Wallet is not active');
    }

    // Create funding transaction
    const transaction = await this.prisma.$transaction(async (tx) => {
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      // Create transaction record
      const txRecord = await tx.orgTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          amount,
          balanceBefore,
          balanceAfter,
          status: TransactionStatus.COMPLETED,
          reference: this.generateReference(),
          description: description || `Wallet funded by admin`,
          metadata: { fundedBy },
        },
      });

      // Update wallet balance
      await tx.orgWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          ledgerBalance: balanceAfter,
        },
      });

      return txRecord;
    });

    return transaction;
  }

  /**
   * Disburse funds to a member (Chairman/Admin only)
   */
  async disburseToMember(input: DisbursementInput, disbursedBy: string) {
    const { orgId, recipientUserId, amount, description } = input;

    // Verify the wallet exists and has sufficient balance
    const wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('Wallet is not active');
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Verify recipient is a member of the organization
    const membership = await this.prisma.orgMembership.findFirst({
      where: {
        orgId,
        userId: recipientUserId,
        isActive: true,
        isBlocked: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('Recipient is not an active member of this organization');
    }

    // Create disbursement transaction
    const transaction = await this.prisma.$transaction(async (tx) => {
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - amount;

      // Create transaction record
      const txRecord = await tx.orgTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          amount,
          balanceBefore,
          balanceAfter,
          status: TransactionStatus.COMPLETED,
          reference: this.generateReference(),
          description: description || `Disbursement to ${membership.user.firstName} ${membership.user.lastName}`,
          recipientUserId,
          metadata: { disbursedBy },
        },
      });

      // Update wallet balance
      await tx.orgWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          ledgerBalance: balanceAfter,
        },
      });

      return { ...txRecord, recipient: membership.user };
    });

    return {
      success: true,
      message: 'Disbursement successful',
      transaction,
    };
  }

  /**
   * Bulk disburse to multiple members
   */
  async bulkDisburse(input: BulkDisbursementInput, disbursedBy: string) {
    const { orgId, recipients } = input;

    // Calculate total amount needed
    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

    // Verify wallet has sufficient balance
    const wallet = await this.prisma.orgWallet.findUnique({
      where: { orgId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.balance) < totalAmount) {
      throw new BadRequestException(`Insufficient balance. Need ${totalAmount}, have ${wallet.balance}`);
    }

    // Process each disbursement
    const results = [];
    let successful = 0;
    let failed = 0;
    let totalDisbursed = 0;

    for (const recipient of recipients) {
      try {
        const result = await this.disburseToMember(
          {
            orgId,
            recipientUserId: recipient.userId,
            amount: recipient.amount,
            description: recipient.description,
          },
          disbursedBy,
        );
        results.push(result);
        successful++;
        totalDisbursed += recipient.amount;
      } catch (error) {
        results.push({
          success: false,
          message: error.message,
          transaction: null,
        });
        failed++;
      }
    }

    return {
      totalRequested: recipients.length,
      successful,
      failed,
      totalAmountDisbursed: totalDisbursed,
      results,
    };
  }

  /**
   * Get eligible members for disbursement with location filters
   */
  async getEligibleMembers(orgId: string, filter?: DisbursementFilterInput) {
    const where: any = {
      orgId,
      isActive: true,
      isBlocked: false,
    };

    // Apply verification filter
    if (filter?.verifiedOnly) {
      where.isVerified = true;
    }

    // Build user location filter
    const userWhere: any = {};

    if (filter?.stateId) {
      userWhere.stateId = filter.stateId;
    }
    if (filter?.lgaId) {
      userWhere.lgaId = filter.lgaId;
    }
    if (filter?.wardId) {
      userWhere.wardId = filter.wardId;
    }
    if (filter?.pollingUnitId) {
      userWhere.pollingUnitId = filter.pollingUnitId;
    }

    // Handle zone filters (need to look up LGAs)
    if (filter?.geopoliticalZoneId) {
      const states = await this.prisma.state.findMany({
        where: { geopoliticalZoneId: filter.geopoliticalZoneId },
        select: { id: true },
      });
      userWhere.stateId = { in: states.map((s) => s.id) };
    }

    if (filter?.senatorialZoneId) {
      const lgas = await this.prisma.lGA.findMany({
        where: { senatorialZoneId: filter.senatorialZoneId },
        select: { id: true },
      });
      userWhere.lgaId = { in: lgas.map((l) => l.id) };
    }

    if (filter?.federalConstituencyId) {
      const lgas = await this.prisma.lGA.findMany({
        where: { federalConstituencyId: filter.federalConstituencyId },
        select: { id: true },
      });
      userWhere.lgaId = { in: lgas.map((l) => l.id) };
    }

    // Add user location filter to membership query
    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    const members = await this.prisma.orgMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            phoneNumber: true,
            state: { select: { name: true } },
            lga: { select: { name: true } },
            ward: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    return members.map((m) => ({
      ...m.user,
      membershipId: m.id,
      isVerified: m.isVerified,
      isLeader: m.isLeader,
      isChairman: m.isChairman,
    }));
  }

  /**
   * Get transaction history with filters
   */
  async getTransactions(filter: TransactionFilterInput) {
    const { walletId, type, status, startDate, endDate, page = 1, limit = 20 } = filter;

    const where: any = {};

    if (walletId) {
      where.walletId = walletId;
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.orgTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallet: {
            include: {
              organization: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.orgTransaction.count({ where }),
    ]);

    // Fetch recipient details for disbursement transactions
    const transactionsWithRecipients = await Promise.all(
      transactions.map(async (tx) => {
        if (tx.recipientUserId) {
          const recipient = await this.prisma.user.findUnique({
            where: { id: tx.recipientUserId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatar: true,
              phoneNumber: true,
            },
          });
          return { ...tx, recipient };
        }
        return tx;
      }),
    );

    return {
      transactions: transactionsWithRecipients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if user can manage wallet for an organization
   */
  async canManageWallet(userId: string, orgId: string): Promise<boolean> {
    // Check if user is platform admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPlatformAdmin: true },
    });

    if (user?.isPlatformAdmin) {
      return true;
    }

    // Check if user is a movement admin (super admin)
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { movementId: true },
    });

    if (org) {
      const movementAdmin = await this.prisma.movementAdmin.findFirst({
        where: {
          userId,
          movementId: org.movementId,
        },
      });

      if (movementAdmin) {
        return true;
      }
    }

    // Check if user is a chairman of this organization
    const membership = await this.prisma.orgMembership.findFirst({
      where: {
        userId,
        orgId,
        isChairman: true,
        isActive: true,
      },
    });

    return !!membership;
  }
}
