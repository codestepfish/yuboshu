import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'

@Injectable()
export class ContentService {
  constructor(
    @InjectQueue('yuboshu')
    private readonly queue: Queue,
  ) {}

  async checkContent(content: any) {
    console.log(content)
    if (!content.avatar || content.avatar === '' || !content.nickname || content.nickname === '') {
      return
    }

    // todo 为啥无效
    await this.queue.add(
      'contentCheckQueue',
      {
        payload: { ...content },
      },
      { removeOnComplete: true, removeOnFail: true },
    )
  }
}
