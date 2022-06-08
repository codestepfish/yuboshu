import { registerAs } from '@nestjs/config'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'

const connectionFactory: MysqlConnectionOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  database: 'yuboshu',
  connectorPackage: 'mysql2',
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  ssl: false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectTimeout: 10000,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
}
export default registerAs('mysql', (): MysqlConnectionOptions => connectionFactory)
