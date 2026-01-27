import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddBankAccountDto {
  @ApiProperty({
    description: 'Bank code',
    example: 'BCA',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  bankCode: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  @MinLength(5, { message: 'Account number must be at least 5 characters' })
  @MaxLength(20, { message: 'Account number must not exceed 20 characters' })
  @Matches(/^[0-9]+$/, { message: 'Account number must contain only digits' })
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Account holder name is required' })
  @MinLength(2, { message: 'Account holder name must be at least 2 characters' })
  @MaxLength(100, { message: 'Account holder name must not exceed 100 characters' })
  accountHolderName: string;
}
