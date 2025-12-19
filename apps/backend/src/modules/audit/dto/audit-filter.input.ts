import { InputType, Field } from '@nestjs/graphql';
import { AuditAction } from '@prisma/client';

@InputType()
export class AuditFilterInput {
  @Field({ nullable: true })
  userId?: string;

  @Field(() => AuditAction, { nullable: true })
  action?: AuditAction;

  @Field({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  movementId?: string;

  @Field({ nullable: true })
  ipAddress?: string;
}
