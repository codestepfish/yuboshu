import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as dayjs from 'dayjs'

@Injectable()
export class JobService {
  @Cron('0 0 */2 * * *')
  async handleCron() {
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'), 'Cron job executed...........')
  }
}
