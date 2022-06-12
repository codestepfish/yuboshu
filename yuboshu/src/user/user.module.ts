import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../entity/user.entity'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { DongTan } from '../entity/dongtan.entity'
import { BullModule } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'
import { BullModuleOptions } from '@nestjs/bull/dist/interfaces/bull-module-options.interface'
import { ContentService } from '../queue/content.service'

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'yuboshu',
      useFactory: (config: ConfigService) => ({ ...config.get<BullModuleOptions>('bull') }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, DongTan]),
  ],
  providers: [UserService, ContentService],
  controllers: [UserController],
})
export class UserModule {}
