import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppExceptionFilter } from './common/filter/exception.filter'
import { TransformInterceptor } from './common/interceptor/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 全局异常过滤器
  app.useGlobalFilters(new AppExceptionFilter())

  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor())

  await app.listen(80)
}

bootstrap()
