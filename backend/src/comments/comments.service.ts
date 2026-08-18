import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: {
        taskId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        author: true,
      },
    });
  }

  async create(
    taskId: string,
    content: string,
    authorId?: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: authorId || null,
      },
      include: {
        author: true,
      },
    });
  }

  async update(id: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.update({
      where: {
        id,
      },
      data: {
        content,
      },
      include: {
        author: true,
      },
    });
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.comment.delete({
      where: {
        id,
      },
    });
  }
}