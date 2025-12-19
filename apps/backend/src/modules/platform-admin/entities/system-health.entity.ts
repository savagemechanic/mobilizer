import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SystemHealth {
  @Field()
  status: string;

  @Field()
  databaseConnected: boolean;

  @Field()
  uptime: number;

  @Field()
  timestamp: Date;
}
