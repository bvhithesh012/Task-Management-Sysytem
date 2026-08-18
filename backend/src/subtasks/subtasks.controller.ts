import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SubtasksService } from './subtasks.service';

@Controller('subtasks')
export class SubtasksController {
  constructor(
    private readonly subtasksService: SubtasksService,
  ) {}

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.subtasksService.findByTask(taskId);
  }

  @Post('task/:taskId')
  create(
    @Param('taskId') taskId: string,
    @Body() body: { title: string },
  ) {
    return this.subtasksService.create(
      taskId,
      body.title,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.subtasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subtasksService.remove(id);
  }
}