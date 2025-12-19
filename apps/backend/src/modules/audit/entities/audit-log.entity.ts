import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { AuditAction } from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';
import { User } from '../../auth/dto/auth-payload';

// Register AuditAction enum for GraphQL
registerEnumType(AuditAction, {
  name: 'AuditAction',
  description: 'Available audit action types',
});

@ObjectType()
export class AuditLogEntity {
  @Field()
  id: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => AuditAction)
  action: AuditAction;

  @Field()
  entityType: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AuditLogPaginated {
  @Field(() => [AuditLogEntity])
  data: AuditLogEntity[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}

@ObjectType()
export class ExportAuditLogsResponse {
  @Field()
  url: string;

  @Field()
  format: string;

  @Field()
  expiresAt: Date;
}
