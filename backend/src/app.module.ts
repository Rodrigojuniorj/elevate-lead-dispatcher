import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { JwtAuthGuard } from './common/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/auth/guards/roles.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DispatcherModule } from './modules/dispatcher/dispatcher.module.js';
import { LeadsModule } from './modules/leads/leads.module.js';
import { PrismaModule } from './providers/prisma/prisma.module.js';
import { QueueModule } from './providers/queue/queue.module.js';
import { envSchema } from './providers/config/env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (environment) => envSchema.parse(environment),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    QueueModule,
    AuthModule,
    DispatcherModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
