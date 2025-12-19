import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MovementAdminUser, Movement } from './movement.entity';

@ObjectType()
export class MovementAdmin {
  @Field(() => ID)
  id: string;

  @Field()
  movementId: string;

  @Field()
  userId: string;

  @Field()
  assignedAt: Date;

  @Field({ nullable: true })
  assignedBy?: string;

  // Relations
  @Field(() => MovementAdminUser, { nullable: true })
  user?: MovementAdminUser;

  @Field(() => Movement, { nullable: true })
  movement?: Movement;
}
