import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        project: true,
        reporter: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        reporterId: userId,
      },
      include: {
        project: true,
        reporter: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        reporter: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: true,
        comments: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    status?: 'TODO' | 'DOING' | 'COMPLETED' | 'ON_HOLD';
    priority?: 'NO_PRIORITY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    projectId?: string;
    reporterId?: string;
  }) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId: data.projectId,
        reporterId: data.reporterId,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: 'TODO' | 'DOING' | 'COMPLETED' | 'ON_HOLD';
      priority?: 'NO_PRIORITY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      dueDate?: string;
      projectId?: string;
      reporterId?: string;
    },
  ) {
    await this.findOne(id);

    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : undefined,
        projectId: data.projectId,
        reporterId: data.reporterId,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }
}