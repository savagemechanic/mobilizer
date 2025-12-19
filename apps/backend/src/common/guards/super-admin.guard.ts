import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is a platform admin (god mode)
    if (user.isPlatformAdmin) {
      return true;
    }

    // Get movementId from arguments
    const args = ctx.getArgs();
    const movementId = args.movementId;

    if (!movementId) {
      throw new ForbiddenException('Movement ID is required');
    }

    // Check if user is a super admin of the requested movement
    const movementAdmin = await this.prisma.movementAdmin.findUnique({
      where: {
        movementId_userId: {
          movementId,
          userId: user.id,
        },
      },
    });

    if (!movementAdmin) {
      throw new ForbiddenException(
        'You do not have super admin access to this movement',
      );
    }

    return true;
  }
}
