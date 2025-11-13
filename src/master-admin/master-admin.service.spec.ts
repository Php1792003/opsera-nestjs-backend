import { Test, TestingModule } from '@nestjs/testing';
import { MasterAdminService } from './master-admin.service';

describe('MasterAdminService', () => {
  let service: MasterAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterAdminService],
    }).compile();

    service = module.get<MasterAdminService>(MasterAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
