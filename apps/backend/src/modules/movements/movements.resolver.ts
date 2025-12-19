import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { Movement } from './entities/movement.entity';
import { MovementStats } from './entities/movement-stats.entity';
import { MovementAdmin } from './entities/movement-admin.entity';
import { CreateMovementInput } from './dto/create-movement.input';
import { UpdateMovementInput } from './dto/update-movement.input';
import { MovementFilterInput } from './dto/movement-filter.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformAdmin } from '../../common/decorators/platform-admin.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => Movement)
export class MovementsResolver {
  constructor(private movementsService: MovementsService) {}

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get all movements with optional filtering
   */
  @Query(() => [Movement], { name: 'movements' })
  @UseGuards(GqlAuthGuard)
  async movements(
    @Args('filter', { nullable: true }) filter?: MovementFilterInput,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.movementsService.findAll(filter, limit, offset);
  }

  /**
   * Get single movement by ID
   */
  @Query(() => Movement, { name: 'movement' })
  @UseGuards(GqlAuthGuard)
  async movement(@Args('id', { type: () => String }) id: string) {
    return this.movementsService.findOne(id);
  }

  /**
   * Get movement by slug
   */
  @Query(() => Movement, { name: 'movementBySlug' })
  @UseGuards(GqlAuthGuard)
  async movementBySlug(@Args('slug', { type: () => String }) slug: string) {
    return this.movementsService.findBySlug(slug);
  }

  /**
   * Get movements where current user is Super Admin
   */
  @Query(() => [Movement], { name: 'myMovements' })
  @UseGuards(GqlAuthGuard)
  async myMovements(@CurrentUser() user: any) {
    return this.movementsService.getUserMovements(user.id);
  }

  /**
   * Get statistics for a movement
   */
  @Query(() => MovementStats, { name: 'movementStats' })
  @UseGuards(GqlAuthGuard)
  async movementStats(@Args('movementId', { type: () => String }) movementId: string) {
    return this.movementsService.getMovementStats(movementId);
  }

  /**
   * Get Super Admins for a movement
   */
  @Query(() => [MovementAdmin], { name: 'movementSuperAdmins' })
  @UseGuards(GqlAuthGuard)
  async movementSuperAdmins(@Args('movementId', { type: () => String }) movementId: string) {
    return this.movementsService.getSuperAdmins(movementId);
  }

  /**
   * Check if user is Super Admin for a movement
   */
  @Query(() => Boolean, { name: 'isMovementSuperAdmin' })
  @UseGuards(GqlAuthGuard)
  async isMovementSuperAdmin(
    @CurrentUser() user: any,
    @Args('movementId', { type: () => String }) movementId: string,
  ) {
    return this.movementsService.isSuperAdmin(user.id, movementId);
  }

  // ============================================
  // MUTATIONS (Platform Admin Only)
  // ============================================

  /**
   * Create a new movement (Platform Admin only)
   */
  @Mutation(() => Movement, { name: 'createMovement' })
  @UseGuards(GqlAuthGuard, PlatformAdminGuard)
  @PlatformAdmin()
  async createMovement(
    @CurrentUser() user: any,
    @Args('input') input: CreateMovementInput,
  ) {
    return this.movementsService.create(input, user.id);
  }

  /**
   * Update a movement (Platform Admin only)
   */
  @Mutation(() => Movement, { name: 'updateMovement' })
  @UseGuards(GqlAuthGuard, PlatformAdminGuard)
  @PlatformAdmin()
  async updateMovement(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateMovementInput,
  ) {
    return this.movementsService.update(id, input);
  }

  /**
   * Soft delete a movement (Platform Admin only)
   */
  @Mutation(() => Boolean, { name: 'deleteMovement' })
  @UseGuards(GqlAuthGuard, PlatformAdminGuard)
  @PlatformAdmin()
  async deleteMovement(@Args('id', { type: () => String }) id: string) {
    return this.movementsService.delete(id);
  }

  /**
   * Assign a Super Admin to a movement (Platform Admin only)
   */
  @Mutation(() => MovementAdmin, { name: 'assignSuperAdmin' })
  @UseGuards(GqlAuthGuard, PlatformAdminGuard)
  @PlatformAdmin()
  async assignSuperAdmin(
    @CurrentUser() user: any,
    @Args('movementId', { type: () => String }) movementId: string,
    @Args('userId', { type: () => String }) userId: string,
  ) {
    return this.movementsService.assignSuperAdmin(movementId, userId, user.id);
  }

  /**
   * Revoke Super Admin privileges (Platform Admin only)
   */
  @Mutation(() => Boolean, { name: 'revokeSuperAdmin' })
  @UseGuards(GqlAuthGuard, PlatformAdminGuard)
  @PlatformAdmin()
  async revokeSuperAdmin(
    @Args('movementId', { type: () => String }) movementId: string,
    @Args('userId', { type: () => String }) userId: string,
  ) {
    return this.movementsService.revokeSuperAdmin(movementId, userId);
  }
}
