import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthPayload } from './dto/auth-payload';
import { UserRolesResponse } from './dto/user-roles.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          ...(input.phoneNumber ? [{ phoneNumber: input.phoneNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        phoneNumber: input.phoneNumber,
        displayName: `${input.firstName} ${input.lastName}`,
        countryId: input.countryId,
        stateId: input.stateId,
        lgaId: input.lgaId,
        wardId: input.wardId,
        pollingUnitId: input.pollingUnitId,
      },
      include: {
        country: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.mapUserToDto(user),
    };
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    // Find user with location data
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: {
        country: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.mapUserToDto(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthPayload> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Verify refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.userId !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
      );

      // Delete old refresh token and store new one
      await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
      await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

      return {
        ...tokens,
        user: this.mapUserToDto(storedToken.user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return true;
    }

    // Generate reset token (in production, send this via email)
    const resetToken = this.generateRandomToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // TODO: Send email with reset token

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return true;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        country: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToDto(user);
  }

  async getUserRoles(userId: string, movementId?: string): Promise<UserRolesResponse[]> {
    // Get all movements where user is a Super Admin
    const movementAdmins = await this.prisma.movementAdmin.findMany({
      where: {
        userId,
        ...(movementId ? { movementId } : {}),
      },
      include: {
        movement: {
          include: {
            supportGroups: {
              where: { isActive: true },
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Get all organization memberships where user is an admin
    const adminMemberships = await this.prisma.orgMembership.findMany({
      where: {
        userId,
        isAdmin: true,
        isActive: true,
        ...(movementId ? { organization: { movementId } } : {}),
      },
      include: {
        organization: {
          include: {
            movement: true,
          },
        },
        role: true,
      },
    });

    // Build response grouped by movement
    const movementRolesMap = new Map<string, UserRolesResponse>();

    // Add Super Admin roles from movementAdmins
    for (const ma of movementAdmins) {
      const movement = ma.movement;
      if (!movementRolesMap.has(movement.id)) {
        movementRolesMap.set(movement.id, {
          movement_id: movement.id,
          movement_name: movement.name,
          roles: [],
        });
      }

      const entry = movementRolesMap.get(movement.id)!;
      // Add Super Admin role
      entry.roles.push({
        role_id: `super-admin-${movement.id}`,
        role_name: 'Super Admin',
        support_groups: movement.supportGroups.map(sg => ({
          id: sg.id,
          name: sg.name,
        })),
      });
    }

    // Add Admin roles from org memberships
    for (const membership of adminMemberships) {
      const org = membership.organization;
      const movement = org.movement;

      if (!movementRolesMap.has(movement.id)) {
        movementRolesMap.set(movement.id, {
          movement_id: movement.id,
          movement_name: movement.name,
          roles: [],
        });
      }

      const entry = movementRolesMap.get(movement.id)!;

      // Check if Admin role already exists for this movement
      const existingAdminRole = entry.roles.find(r => r.role_name === 'Admin');

      if (existingAdminRole) {
        // Add this org to the support_groups
        if (!existingAdminRole.support_groups) {
          existingAdminRole.support_groups = [];
        }
        existingAdminRole.support_groups.push({
          id: org.id,
          name: org.name,
        });
      } else {
        // Create new Admin role entry
        entry.roles.push({
          role_id: membership.role?.id || `admin-${org.id}`,
          role_name: membership.role?.name || 'Admin',
          support_groups: [{
            id: org.id,
            name: org.name,
          }],
        });
      }
    }

    return Array.from(movementRolesMap.values());
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  private mapUserToDto(user: any) {
    const baseUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      isPlatformAdmin: user.isPlatformAdmin || false,
      isSuspended: user.isSuspended || false,
      suspendedReason: user.suspendedReason || null,
      suspendedAt: user.suspendedAt || null,
      createdAt: user.createdAt,
    };

    // Add location data if available
    if (user.country || user.state || user.lga || user.ward || user.pollingUnit) {
      return {
        ...baseUser,
        location: {
          country: user.country || null,
          state: user.state || null,
          lga: user.lga || null,
          ward: user.ward || null,
          pollingUnit: user.pollingUnit || null,
        },
      };
    }

    return baseUser;
  }
}
