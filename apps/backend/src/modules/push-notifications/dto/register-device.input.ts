import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

@InputType()
export class RegisterDeviceInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field()
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deviceName?: string;
}

@InputType()
export class UnregisterDeviceInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}
