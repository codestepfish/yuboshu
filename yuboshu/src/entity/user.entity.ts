import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string

  @Column()
  nickname: string

  @Column()
  avatar: string

  @Column()
  openid: string

  @Column()
  unionid: string

  @Column()
  phone: string

  @Column()
  status: boolean

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  create_time: Date

  @Column({ type: 'datetime', onUpdate: 'CURRENT_TIMESTAMP' })
  update_time: Date
}
