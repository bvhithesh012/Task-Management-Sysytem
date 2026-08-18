import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret-change-me',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, JwtAuthGuard],
})
export class TasksModule {}