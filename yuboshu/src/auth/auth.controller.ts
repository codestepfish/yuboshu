import { Body, Controller, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginParam } from './dto/login.param'
import { Request } from 'express'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Req() req: Request, @Body() loginParam: LoginParam): Promise<LoginDto> {
    return await this.authService.login(req, loginParam)
  }
}
