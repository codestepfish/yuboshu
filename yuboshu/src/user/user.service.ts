import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../entity/user.entity'
import { Repository } from 'typeorm'
import { Request } from 'express'
import { Cache } from 'cache-manager'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async handleMsg(req: Request, msg: any) {
    console.log('============> 接收到微信推送消息***************\n ', msg)
    if (msg.MsgType && msg.Event && msg.MsgType === 'event' && msg.Event === 'wxa_media_check') {
      // 内容安全
      await this.handleContentCheck(msg)
    }
  }

  async handleContentCheck(msg: any) {
    if (msg.result && msg.result.label !== 100) {
      const traceId = msg.trace_id
      const userId: string = await this.cacheManager.get(`trace_id:${traceId}`)
      console.log('安全检查[昵称]未通过, 删除用户: ', userId)
      await this.usersRepository.delete({ id: userId })
    }
  }

  async checkUser(req: Request): Promise<boolean> {
    const openid = req.header('x-wx-openid') || ''

    const user = await this.usersRepository.findOneBy({ openid })
    return !!user
  }
}
