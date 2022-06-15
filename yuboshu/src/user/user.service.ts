import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../entity/user.entity'
import { Repository } from 'typeorm'
import { Request } from 'express'
import { Cache } from 'cache-manager'
import { DongtanParam } from './dto/dongtan.param'
import { AppException } from '../common/exception/app.exception'
import { DongTan } from '../entity/dongtan.entity'
import { ContentService } from '../queue/content.service'
import { DongtanDto } from './dto/dongtan.dto'
import axios from 'axios'
import { randomInt } from 'crypto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DongTan)
    private dongtanRepository: Repository<DongTan>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly contentService: ContentService,
  ) {}

  async disableUser(id: string) {
    const user = await this.userRepository.findOneBy({ id })
    user.status = false
    user.update_time = new Date()
    await this.userRepository.update(id, user)
  }

  async handleMsg(req: Request, msg: any) {
    console.log('============> 接收到微信推送消息***************\n ', msg)
    if (msg.MsgType && msg.Event && msg.MsgType === 'event' && msg.Event === 'wxa_media_check') {
      // 内容安全
      await this.handleContentCheck(msg)
    }
  }

  // 内容安全检查 处理
  async handleContentCheck(msg: any) {
    const traceId = msg.trace_id
    const content: any = await this.cacheManager.get(`trace_id:${traceId}`)

    if (msg.result && msg.result.label !== 100) {
      switch (content.type) {
        case 'userInfo':
          if (msg.result && msg.result.label !== 100) {
            console.log('安全检查[用户头像]未通过, 禁用用户: ', content.value)
            await this.disableUser(content.value)
          }
          break
        case 'dongtan':
          if (msg.result && msg.result.label !== 100) {
            console.log('安全检查[动弹图片]未通过, 删除动弹: ', content.value)
            await this.delDongTan(content.value)
          }
          break
      }
    }
  }

  async checkUser(req: Request): Promise<boolean> {
    const openid = req.header('x-wx-openid') || ''

    const user = await this.userRepository.findOneBy({ openid, status: true })
    return !!user
  }

  async dongtan(req: Request, param: DongtanParam) {
    const openid = req.header('x-wx-openid') || ''
    console.log('----->', openid, param)
    const user = await this.userRepository.findOneBy({ openid })

    if (!user) {
      throw new AppException(600, '用户不存在')
    }

    const dongtan = new DongTan()

    dongtan.user_id = user.id
    dongtan.content = param.content?.trim() || ''
    if (param.imgs && param.imgs.length > 0) {
      const urls = param.imgs.map((img) => img.url)
      dongtan.imgs = urls.join(',')
    }
    dongtan.address = param.address || ''
    if (param.latitude && param.longitude) {
      const point = `POINT(${param.longitude} ${param.latitude})`
      dongtan.location = point
    }

    const dt = await this.dongtanRepository.save<DongTan>(dongtan)

    // 内容安全检查
    await this.contentService.checkDongTanContent({ ...dt, openid })
  }

  async delDongTan(id: string) {
    const dongtan = await this.dongtanRepository.findOneBy({ id })
    if (!dongtan) {
      throw new AppException(600, '动弹不存在')
    }

    dongtan.delete_time = new Date()
    await this.dongtanRepository.update(id, dongtan)
  }

  async getDongtan(req: Request): Promise<DongtanDto> {
    const dts: Array<DongtanDto> = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(DongTan, 'dongtan', 'user.id = dongtan.user_id')
      .where('user.status = true')
      .andWhere('dongtan.delete_time is null')
      .orderBy('dongtan.create_time', 'DESC')
      .select(
        `
        dongtan.id,
        user.id as user_id,
        user.nickname,
        user.avatar,
        dongtan.content,
        dongtan.imgs,
        dongtan.address
      `,
      )
      .offset(0)
      .limit(100)
      .getRawMany<DongtanDto>()

    const item: DongtanDto = dts[randomInt(0, dts.length)]

    if (item) {
      // avatar图片
      const avatarRes: any = await axios.post('http://api.weixin.qq.com/tcb/batchdownloadfile', {
        env: 'prod-3gzj8o0we6005e14',
        file_list: [{ fileid: item.avatar, max_age: 1800 }],
      })

      item.avatar = avatarRes.data?.file_list[0].download_url

      // imgs图片
      if (item.imgs && typeof item.imgs === 'string' && item.imgs.length > 0) {
        const imsRes: any = await axios.post('http://api.weixin.qq.com/tcb/batchdownloadfile', {
          env: 'prod-3gzj8o0we6005e14',
          file_list: item.imgs
            .split(',')
            .filter((img) => img && img.length > 0)
            .map((img) => ({ fileid: img, max_age: 1800 })),
        })

        item.imgs = imsRes.data?.file_list.map((img) => img.download_url)
      }

      return { ...item }
    }

    return null
  }
}
