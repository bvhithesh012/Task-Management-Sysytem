import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('SubtasksController', () => {
  let controller: SubtasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubtasksController],
      providers: [
        {
          provide: SubtasksService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<SubtasksController>(SubtasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});