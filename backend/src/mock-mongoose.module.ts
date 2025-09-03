// Temporary MongoDB bypass for testing
// Add this to your app.module.ts imports array to replace MongooseModule.forRootAsync

import { Module, DynamicModule } from '@nestjs/common';

@Module({})
export class MockMongooseModule {
  static forRootAsync(): DynamicModule {
    return {
      module: MockMongooseModule,
      providers: [
        {
          provide: 'DatabaseConnection',
          useValue: {
            connection: { readyState: 1 },
            model: () => ({
              find: () => ({ exec: () => Promise.resolve([]) }),
              findOne: () => ({ exec: () => Promise.resolve(null) }),
              findOneAndUpdate: () => ({ exec: () => Promise.resolve(null) }),
              create: () => Promise.resolve({}),
              updateMany: () => Promise.resolve({ modifiedCount: 0 }),
            }),
          },
        },
      ],
      exports: ['DatabaseConnection'],
      global: true,
    };
  }
}
