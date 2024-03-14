import { Controller, Get } from '@nestjs/common';
import { ImportDataService } from './importData.service';

@Controller('importData')
export class ImportNewsController {
    constructor(private readonly importNewsService: ImportDataService) { }

    @Get()
    async importData() {
        await this.importNewsService.importKategorien();
        await this.importNewsService.importGroups()
        await this.importNewsService.importNews();
    }

    @Get('clickhouse')
    async importDataByclickHouse() {
        const r = await this.importNewsService.importDataByClickHouse()
        return r
    }
}