import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsModule } from './modules/news/news.module';
import { ImportDataModule } from './modules/import-data/importData.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cronjob/cron.module';

@Module({
  imports: [NewsModule, ImportDataModule, ScheduleModule.forRoot(), CronModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
