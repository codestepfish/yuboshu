import { All, Body, Controller, Post, Req } from '@nestjs/common'
import { UserService } from './user.service'
import { Request } from 'express'
import { DongtanParam } from './dto/dongtan.param'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @All('/msg') // 微信消息
  async handleMsg(@Req() req: Request, @Body() msg: any) {
    await this.userService.handleMsg(req, msg)
  }

  @Post('check') // 检查用户状态
  async checkUser(@Req() req: Request): Promise<boolean> {
    return await this.userService.checkUser(req)
  }

  @Post('dongtan') // 发布动弹
  async dongtan(@Req() req: Request, @Body() dontanParam: DongtanParam) {
    await this.userService.dongtan(req, dontanParam)
  }
}
