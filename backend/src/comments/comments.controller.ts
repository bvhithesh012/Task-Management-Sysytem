import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId);
  }

  @Post('task/:taskId')
  create(
    @Param('taskId') taskId: string,
    @Body()
    body: {
      content: string;
      authorId?: string;
    },
  ) {
    return this.commentsService.create(
      taskId,
      body.content,
      body.authorId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.commentsService.update(
      id,
      body.content,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}