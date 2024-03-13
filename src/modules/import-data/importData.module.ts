import { Module } from '@nestjs/common';
import { ImportDataService } from './importData.service';
import { ImportNewsController } from './importData.controller';

@Module({
    providers: [ImportDataService],
    controllers: [ImportNewsController],
})
export class ImportDataModule { }