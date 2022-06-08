import { CacheModule, MiddlewareConsumer, Module } from '@nestjs/common'
import { LoggerMiddleware } from './common/middlewire/logger.middleware'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule, ConfigService } from '@nestjs/config'
import mongoConfig from './config/mysql.config'
import redisConfig from './config/redis.config'
import bullConfig from './config/bull.config'
import { RedisClientOptions } from 'redis'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from './user/user.module'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { AuthModule } from './auth/auth.module'
import { JobModule } from './tasks/job.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [mongoConfig, redisConfig, bullConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({ ...config.get<MysqlConnectionOptions>('mysql') }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: (config: ConfigService) => ({ ...config.get<RedisClientOptions>('redis') }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    JobModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  // 中间件
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
