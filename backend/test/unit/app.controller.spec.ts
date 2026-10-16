import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns the API health contract', () => {
      expect(appController.health()).toEqual({
        status: 'ok',
        service: 'elevate-lead-dispatcher-api',
      });
    });
  });
});
