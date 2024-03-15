import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { exec } from 'child_process';
import { ClickHouse } from 'clickhouse';
@Injectable()
export class ImportDataService {
  public async exportTableData() {
    const res = await Promise.all([
      await this.importNews(),
      await this.importKategorien(),
      await this.importGroups(),
    ]);

    return res;
  }

  public async importNews() {
    console.log(
      'importing News',
      fs.existsSync(`${process.cwd()}/src/data/news.json`),
    );
    try {
      let isSuccess = true;
      if (fs.existsSync(`${process.cwd()}/src/data/news.json`)) {
        fs.unlinkSync(`${process.cwd()}/src/data/news.json`);
      }
      if (fs.existsSync('../../data/news.json.gz')) {
        fs.unlinkSync('../../data/news.json.gz');
      }
      var script = exec(
        'sh src/data/export-news-json.sh',
        (error, stdout, stderr) => {
          console.log('stdout=====>', stdout);
          console.log('stderr news ======', stderr);
          if (!stderr) {
            exec('gzip -k src/data/news.json');
          } else {
            isSuccess = false;
          }
        },
      );

      return { isSuccess };
    } catch (error) {
      console.log('error while import News Data ============>', error);
    }
  }

  public async importKategorien() {
    console.log('importing Kategorie');
    try {
      let isSuccess = true;
      if (fs.existsSync('src/data/kategorien.json')) {
        fs.unlinkSync('src/data/kategorien.json');
      }
      if (fs.existsSync('src/data/kategorien.json.gz')) {
        fs.unlinkSync('src/data/kategorien.json.gz');
      }
      var script = exec(
        'sh src/data/export-kategorien-json.sh',
        (error, stdout, stderr) => {
          console.log('stdout=====>', stdout);
          console.log('stderr kategorien: ', stderr);
          if (!stderr) {
            exec('gzip -k src/data/kategorien.json');
          } else {
            isSuccess = false;
          }
        },
      );

      return { isSuccess };
    } catch (error) {
      console.log('error while import category Data ============>', error);
    }
  }

  public async importGroups() {
    console.log('importing Groups');
    try {
      let isSuccess = true;
      if (fs.existsSync('src/data/group.json')) {
        fs.unlinkSync('src/data/group.json');
      }
      if (fs.existsSync('src/data/group.json.gz')) {
        fs.unlinkSync('src/data/group.json.gz');
      }
      var script = exec(
        'sh src/data/export-gruppen-json.sh',
        (error, stdout, stderr) => {
          console.log('stdout=====>', stdout);
          console.log('stderr group: ', stderr);
          if (!stderr) {
            exec('gzip -k src/data/group.json');
          } else {
            isSuccess = false;
          }
        },
      );
      return { isSuccess };
    } catch (error) {
      console.log('error while import group Data ============>', error);
    }
  }

  public async importDataByClickHouse() {
    const clickhouse = new ClickHouse({
      url: 'http://localhost',
      port: 8123,
      debug: false,
      // isUseGzip: false,
      //  trimQuery: false,
      //  usePost: false,
      format: 'json', // "json" || "csv" || "tsv"
      // raw: false,
      config: {
        database: null,
      },
    });
    clickhouse
      .query(
        `SELECT * FROM
   mysql(
    'host:port',
    'DBNAME,
    'gruppen',
    'USER',
    'DBPASSWORD'
)
INTO OUTFILE "/home/nishaltaylor/workspace/projects/redis-stack-poc/redis-stack-poc/src/data/group.json"`,
      )
      .exec(function (err, rows) {
        console.log(err, 'err==============>');
        console.log(rows, 'rows=============================>>>>>>>>>>>>>>');
      });
    console.log(clickhouse);
  }
}
