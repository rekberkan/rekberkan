import { IsNumber, IsEnum, IsOptional, Min, Max, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  E_WALLET = 'E_WALLET',
  QRIS = 'QRIS',
  CREDIT_CARD = 'CREDIT_CARD',
  RETAIL_OUTLET = 'RETAIL_OUTLET',
}

export enum BankCode {
  BCA = 'BCA',
  BNI = 'BNI',
  BRI = 'BRI',
  MANDIRI = 'MANDIRI',
  PERMATA = 'PERMATA',
  CIMB = 'CIMB',
}

export enum EWalletType {
  OVO = 'OVO',
  DANA = 'DANA',
  GOPAY = 'GOPAY',
  SHOPEEPAY = 'SHOPEEPAY',
  LINKAJA = 'LINKAJA',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Amount to top-up in minor units (Rupiah)',
    example: 500000,
    minimum: 10000,
    maximum: 100000000,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(10000, { message: 'Minimum top-up is Rp 10,000' })
  @Max(100000000, { message: 'Maximum top-up is Rp 100,000,000' })
  amountMinor: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'IDR',
    default: 'IDR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.VIRTUAL_ACCOUNT,
  })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Bank code for VA/Bank Transfer',
    enum: BankCode,
    example: BankCode.BCA,
  })
  @IsOptional()
  @IsEnum(BankCode)
  bankCode?: BankCode;

  @ApiPropertyOptional({
    description: 'E-Wallet type',
    enum: EWalletType,
    example: EWalletType.OVO,
  })
  @IsOptional()
  @IsEnum(EWalletType)
  eWalletType?: EWalletType;

  @ApiPropertyOptional({
    description: 'Phone number for e-wallet (required for some e-wallets)',
    example: '08123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Transform(({ value }) => value?.replace(/\D/g, ''))
  phoneNumber?: string;
}
