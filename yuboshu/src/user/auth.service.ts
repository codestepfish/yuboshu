import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../entity/user.entity'
import { Repository } from 'typeorm'
import { LoginParam } from './dto/login.param'
import { LoginDto } from './dto/login.dto'
import { Request } from 'express'
import { ContentService } from '../queue/content.service'
import axios from 'axios'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly contentService: ContentService,
  ) {}

  async login(req: Request, loginParam: LoginParam): Promise<LoginDto> {
    const openid = req.header('x-wx-openid') || ''
    const unionid = req.header('x-wx-unionid') || ''

    let user: User = await this.userRepository.findOneBy({ openid, unionid })

    if (!user) {
      user = new User()
      user.openid = openid
      user.unionid = unionid
    } else {
      // 已存在
      loginParam.avatar ? (user.avatar = loginParam.avatar) : null
      loginParam.nickname ? (user.nickname = loginParam.nickname) : null
    }

    if (loginParam.cloudID && loginParam.cloudID !== '') {
      const res: any = await axios.post(`http://api.weixin.qq.com/wxa/getopendata?openid=${openid}`, { cloudid_list: [loginParam.cloudID] })
      user.phone = (res.data && res.data.data_list && JSON.parse(res.data.data_list[0].json).data?.purePhoneNumber) || ''
    }
    if (!user.phone || user.phone === '') {
      console.error('手机号获取失败')
      return null
    }

    user.status = true

    user = await this.userRepository.save<User>(user)

    // 内容安全审查
    await this.contentService.checkUserInfo({ ...user })

    const dto = new LoginDto()
    dto.id = user.id
    dto.avatar = user.avatar || ''
    dto.nickname = user.nickname || ''
    dto.phone = user.phone.substring(0, 3) + '****' + user.phone.substring(7)

    return dto
  }
}
