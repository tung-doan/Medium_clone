import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await (this.$connect as () => Promise<void>).call(this);
  }
}
