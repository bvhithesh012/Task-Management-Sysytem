import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubtasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTask(taskId: string) {
    return this.prisma.subtask.findMany({
      where: {
        taskId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async create(taskId: string, title: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.subtask.create({
      data: {
        title,
        taskId,
      },
    });
  }

  async update(id: string, body: any) {
    const subtask = await this.prisma.subtask.findUnique({
      where: {
        id,
      },
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    return this.prisma.subtask.update({
      where: {
        id,
      },
      data: {
        ...(body.title !== undefined && {
          title: body.title,
        }),

        ...(body.completed !== undefined && {
          completed: Boolean(body.completed),
        }),
      },
    });
  }

  async remove(id: string) {
    const subtask = await this.prisma.subtask.findUnique({
      where: {
        id,
      },
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    return this.prisma.subtask.delete({
      where: {
        id,
      },
    });
  }
}