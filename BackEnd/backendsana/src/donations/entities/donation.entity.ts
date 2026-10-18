import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Table `donation`: stores successful Wompi donation transactions.
 */
@Entity({ name: 'donation' })
export class Donation {
  @PrimaryGeneratedColumn({ name: 'don_id' })
  donId!: number;

  @Column({ name: 'don_wompi_transaction_id', type: 'varchar', length: 100, unique: true })
  donWompiTransactionId!: string;

  @Column({ name: 'don_reference', type: 'varchar', length: 100 })
  donReference!: string;

  @Column({ name: 'don_amount_in_cents', type: 'bigint' })
  donAmountInCents!: string;

  @Column({ name: 'don_currency', type: 'varchar', length: 5, default: 'COP' })
  donCurrency!: string;

  @Column({ name: 'don_status', type: 'varchar', length: 30 })
  donStatus!: string;

  @Column({ name: 'don_payment_method_type', type: 'varchar', length: 50, nullable: true })
  donPaymentMethodType!: string | null;

  @Column({ name: 'don_donor_email', type: 'varchar', length: 150, nullable: true })
  donDonorEmail!: string | null;

  @Column({ name: 'don_donor_full_name', type: 'varchar', length: 200, nullable: true })
  donDonorFullName!: string | null;

  @Column({ name: 'don_environment', type: 'varchar', length: 20, default: 'test' })
  donEnvironment!: string;

  @Column({
    name: 'don_wompi_created_at',
    type: 'timestamptz',
    nullable: true,
  })
  donWompiCreatedAt!: Date | null;

  @Column({
    name: 'don_created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  donCreatedAt!: Date;
}
