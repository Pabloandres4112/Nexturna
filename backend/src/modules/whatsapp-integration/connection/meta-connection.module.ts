import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaConnectionEntity } from './meta-connection.entity';
import { MetaConnectionService } from './meta-connection.service';
import { MetaConnectionController } from './meta-connection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MetaConnectionEntity])],
  controllers: [MetaConnectionController],
  providers: [MetaConnectionService],
  exports: [MetaConnectionService],
})
export class MetaConnectionModule {}
