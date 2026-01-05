import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Config
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

// Services
import { PrismaService } from './prisma/prisma.service';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PostsModule } from './modules/posts/posts.module';
import { EventsModule } from './modules/events/events.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { MovementsModule } from './modules/movements/movements.module';
import { AuditModule } from './modules/audit/audit.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { LocationsModule } from './modules/locations/locations.module';
import { UploadModule } from './modules/upload/upload.module';
import { PushNotificationsModule } from './modules/push-notifications/push-notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { AiModule } from './modules/ai/ai.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { LegalModule } from './modules/legal/legal.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig],
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        return {
          message: error.message,
          code: error.extensions?.code,
          statusCode: error.extensions?.statusCode,
          path: error.path,
        };
      },
    }),

    // Feature Modules
    FirebaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    MovementsModule,
    OrganizationsModule,
    PostsModule,
    EventsModule,
    ChatModule,
    NotificationsModule,
    AdminModule,
    PlatformAdminModule,
    LocationsModule,
    UploadModule,
    PushNotificationsModule,
    JobsModule,
    AiModule,
    LegalModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
