import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { LabelsService } from './labels.service';

@Controller('labels')
export class LabelsController {
  constructor(
    private readonly labelsService: LabelsService,
  ) {}

  @Get()
  findAll() {
    return this.labelsService.findAll();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.labelsService.create(body.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labelsService.delete(id);
  }

  @Get('task/:taskId')
  getTaskLabels(@Param('taskId') taskId: string) {
    return this.labelsService.getTaskLabels(taskId);
  }

  @Post('task/:taskId/:labelId')
  addToTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelsService.addToTask(taskId, labelId);
  }

  @Delete('task/:taskId/:labelId')
  removeFromTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelsService.removeFromTask(
      taskId,
      labelId,
    );
  }
}