import { Process, Processor } from '@nestjs/bull'
import axios from 'axios'
import { CACHE_MANAGER, Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { AuthService } from '../auth/auth.service'
import { Job } from 'bull'

// 内容安全检查
@Processor('yuboshu')
export class ContentProcessor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache, private readonly authService: AuthService) {}

  @Process('contentCheckQueue')
  async process(job: Job) {
    console.log('===========> [内容安全检查]收到队列消息*********\n ', job.data)
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
      // 删除此用户
      console.log('安全检查[昵称]未通过, 删除用户: ', payload.id)
      await this.authService.delUser(payload.id)
      return
    }

    // img 链接
    const imgRes: any = await axios.post('http://api.weixin.qq.com/tcb/batchdownloadfile', {
      env: 'prod-3gzj8o0we6005e14',
      file_list: [{ fileid: payload.avatar, max_age: 1800 }],
    })

    const avatarUrl = imgRes.data?.file_list[0].download_url

    const res: any = await axios.post('http://api.weixin.qq.com/wxa/media_check_async', {
      media_url: avatarUrl,
      media_type: 2,
      version: 2,
      openid: payload.openid,
      scene: 1,
    })
    console.log('安全检查[头像] 结果: ', res.data)
    if (res.data && res.data.trace_id) {
      await this.cacheManager.set(`trace_id:${res.data.trace_id}`, payload.id, { ttl: 35 * 60 })
    }
  }
}
