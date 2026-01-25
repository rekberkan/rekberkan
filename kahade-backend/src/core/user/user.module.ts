import { Module } from '@nestjs/common';
import { UserController, UsersController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { DatabaseModule } from '@infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController, UsersController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
