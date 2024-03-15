import { Controller, Get } from '@nestjs/common';
import { ImportDataService } from './importData.service';

@Controller('import-data')
export class ImportNewsController {
  constructor(private readonly importNewsService: ImportDataService) {}

  @Get()
  async importData() {
    const data = await this.importNewsService.exportTableData();
  }

  @Get('clickhouse')
  async importDataByclickHouse() {
    const res = await this.importNewsService.importDataByClickHouse();
    return res;
  }
}
