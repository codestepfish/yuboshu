import { Process, Processor } from '@nestjs/bull'
import axios from 'axios'
import { CACHE_MANAGER, Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { AuthService } from '../auth/auth.service'
import { Job } from 'bull'
import { UserService } from '../user/user.service'

// 内容安全检查
@Processor('yuboshu')
export class ContentProcessor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Process('userInfoCheckQueue')
  async processUserInfoCheck(job: Job) {
    console.log('===========> [内容安全检查-userInfo]收到队列消息*********\n ', job.data)
    const payload = job.data.payload

    const msgRes: any = await axios.post('http://api.weixin.qq.com/wxa/msg_sec_check', {
      version: 2,
      openid: payload.openid,
      scene: 1,
      content: payload.nickname,
      nickname: payload.nickname,
    })
    console.log('安全检查[昵称] 结果: ', msgRes.data)
    if (msgRes.data.result && msgRes.data.result.label !== 100) {
      // 禁用此用户
      console.log('安全检查[昵称]未通过, 禁用用户: ', payload.id)
      await this.userService.disableUser(payload.id)
      return
    }

    // img 链接
    const imgRes: any = await axios.post('http://api.weixin.qq.com/tcb/batchdownloadfile', {
      env: 'prod-3gzj8o0we6005e14',
      file_list: [{ fileid: payload.avatar, max_age: 1800 }],
    })

    const avatarUrl = imgRes.data?.file_list[0].download_url

    await this.handleCheckImg(payload.openid, avatarUrl, 1, {
      type: 'userInfo',
      value: payload.id,
    })
  }

  @Process('dongTanCheckQueue')
  async processDongTanCheck(job: Job) {
    console.log('===========> [内容安全检查-动弹]收到队列消息*********\n ', job.data)

    const payload = job.data.payload

    const content = payload.content // 动弹内容

    if (content && content !== '') {
      const contentRes: any = await axios.post('http://api.weixin.qq.com/wxa/msg_sec_check', {
        version: 2,
        openid: payload.openid,
        scene: 2,
        content,
      })
      console.log('安全检查[动弹内容] 结果: ', contentRes.data)
      if (contentRes.data.result && contentRes.data.result.label !== 100) {
        console.log('安全检查[动弹内容]未通过, 予以删除 : ', payload.id)
        await this.userService.delDongTan(payload.id)
        return
      }
    }

    const address = payload.address // 地址内容

    if (address && address !== '') {
      const addressRes: any = await axios.post('http://api.weixin.qq.com/wxa/msg_sec_check', {
        version: 2,
        openid: payload.openid,
        scene: 2,
        content: address,
      })
      console.log('安全检查[动弹地址内容] 结果: ', addressRes.data)
      if (addressRes.data.result && addressRes.data.result.label !== 100) {
        console.log('安全检查[动弹地址内容]未通过, 予以删除 : ', payload.id)
        await this.userService.delDongTan(payload.id)
        return
      }
    }

    // 图片
    const imgs = payload.imgs // 图片列表
    if (!imgs || imgs === '') {
      return
    }

    const urls = imgs.split(',')

    for (const item of urls) {
      await this.handleCheckImg(payload.openid, item, 2, {
        type: 'dongtan',
        value: payload.id,
      })
    }
  }

  // 图片 类型 内容安全检查
  async handleCheckImg(openid: string, fileid: string, scene: number, data: any) {
    // img 链接
    const imgRes: any = await axios.post('http://api.weixin.qq.com/tcb/batchdownloadfile', {
      env: 'prod-3gzj8o0we6005e14',
      file_list: [{ fileid, max_age: 1800 }],
    })

    const avatarUrl = imgRes.data?.file_list[0].download_url

    const res: any = await axios.post('http://api.weixin.qq.com/wxa/media_check_async', {
      media_url: avatarUrl,
      media_type: 2,
      version: 2,
      openid,
      scene,
    })
    console.log('安全检查[图片] 已提交 待审核: ', res.data)
    if (res.data && res.data.trace_id) {
      await this.cacheManager.set(`trace_id:${res.data.trace_id}`, data, { ttl: 35 * 60 })
    }
  }
}
