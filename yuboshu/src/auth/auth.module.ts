import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../entity/user.entity'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { ContentService } from '../queue/content.service'
import { ContentProcessor } from '../queue/content.processor'
import { BullModule } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'
import { BullModuleOptions } from '@nestjs/bull/dist/interfaces/bull-module-options.interface'

@Global()
@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'yuboshu',
      useFactory: (config: ConfigService) => ({ ...config.get<BullModuleOptions>('bull') }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AuthService, ContentService, ContentProcessor],
  controllers: [AuthController],
})
export class AuthModule {}
