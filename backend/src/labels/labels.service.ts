import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.label.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(name: string) {
    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error('Label name is required');
    }

    return this.prisma.label.upsert({
      where: {
        name: cleanName,
      },
      update: {},
      create: {
        name: cleanName,
      },
    });
  }

  async delete(id: string) {
    const label = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return this.prisma.label.delete({
      where: { id },
    });
  }

  async getTaskLabels(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.taskLabel.findMany({
      where: { taskId },
      include: {
        label: true,
      },
    });
  }

  async addToTask(taskId: string, labelId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return this.prisma.taskLabel.upsert({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
      update: {},
      create: {
        taskId,
        labelId,
      },
      include: {
        label: true,
      },
    });
  }

  async removeFromTask(taskId: string, labelId: string) {
    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (!taskLabel) {
      throw new NotFoundException(
        'Label is not assigned to this task',
      );
    }

    return this.prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });
  }
}