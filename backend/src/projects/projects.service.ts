import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        lead: true,
        tasks: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: {
        id,
      },
      include: {
        lead: true,
        tasks: true,
      },
    });
  }

  async create(body: any) {
    return this.prisma.project.create({
      data: {
        name: body.name,
        priority: body.priority ?? 'NO_PRIORITY',
        dueDate: body.dueDate
          ? new Date(body.dueDate)
          : null,
        leadId: body.leadId ?? null,
      },
      include: {
        lead: true,
        tasks: true,
      },
    });
  }

  async update(id: string, body: any) {
    return this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...(body.name !== undefined && {
          name: body.name,
        }),

        ...(body.priority !== undefined && {
          priority: body.priority,
        }),

        ...(body.dueDate !== undefined && {
          dueDate: body.dueDate
            ? new Date(body.dueDate)
            : null,
        }),

        ...(body.leadId !== undefined && {
          leadId: body.leadId || null,
        }),
      },
      include: {
        lead: true,
        tasks: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: {
        id,
      },
    });
  }
}