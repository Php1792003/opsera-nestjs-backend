import { Test, TestingModule } from '@nestjs/testing';
import { MasterAdminController } from './master-admin.controller';

describe('MasterAdminController', () => {
  let controller: MasterAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterAdminController],
    }).compile();

    controller = module.get<MasterAdminController>(MasterAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
