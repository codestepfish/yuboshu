import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'

@Injectable()
export class ContentService {
  constructor(
    @InjectQueue('yuboshu')
    private readonly queue: Queue,
  ) {}

  async checkUserInfo(content: any) {
    console.log('---------> 检查用户基本信息: ', content)
    if (!content.avatar || content.avatar === '' || !content.nickname || content.nickname === '') {
      return
    }

    await this.queue.add(
      'userInfoCheckQueue',
      {
        payload: { ...content },
      },
      { removeOnComplete: true, removeOnFail: true },
    )
  }

  async checkDongTanContent(param: {
    openid: string
    imgs: string
    address: string
    delete_time: Date
    create_time: Date
    user_id: string
    location: string
    id: string
    content: string
  }) {
    console.log('---------> 检查动弹内容: ', param)

    await this.queue.add(
      'dongTanCheckQueue',
      {
        payload: { ...param },
      },
      { removeOnComplete: true, removeOnFail: true },
    )
  }
}
