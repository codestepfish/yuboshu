import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'dongtan' })
export class DongTan {
  @PrimaryGeneratedColumn()
  id: string

  @Column()
  @Index('user_id')
  user_id: string

  @Column()
  content: string

  @Column()
  imgs: string

  @Column()
  address: string

  @Column({ type: 'point' })
  @Index('location')
  location: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  create_time: Date

  @Column({ type: 'datetime' })
  delete_time: Date
}
