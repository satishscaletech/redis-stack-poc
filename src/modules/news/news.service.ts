import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import redis from '../../lib/redis';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import { getPaginateOffset } from 'src/helper';
// const StreamArray = require('stream-json/streamers/StreamArray');

@Injectable()
export class NewsService {
  public async storeNews() {
    const readStream = await fs
      .createReadStream(
        '/home/scaletech-sm/Downloads/nachrichten_202312221301.json',
        'utf-8',
      )
      .pipe(StreamArray.withParser());

    readStream.on('data', async function (chunk) {
      const news = chunk.value;
      news.id = news.id;
      news.datum = news.datum ?? '';
      news.sprache = news.sprache ?? '';
      news.source_code = news.source_code ?? '';
      news.grusel = news.grusel ?? '';
      news.bild = news.bild ?? '';
      news.bild_info = news.bild_info ?? '';
      news.titel = news.titel ?? '';
      news.einleitung = news.einleitung ?? '';
      news.inhalt = news.inhalt ?? '';
      news.html = news.html ?? 0;
      news.autor = news.auto ?? '';
      news.quelle = news.quelle ?? '';
      news.externe_id = news.externe_id ?? 0;
      news.sicherungszeit = news.sicherungszeit ?? '';
      const res = await redis.store(`newsMatflix10:${news.id}`, news);
      console.log('Redis res', res);
    });

    readStream.on('end', function () {
      console.log('finished reading');
      // write to file here.
    });
  }

  public async storeCategories() {
    const readStream = fs
      .createReadStream('', 'utf-8')
      .pipe(StreamArray.withParser());

    let count = 1;

    readStream.on('data', async (chunk) => {
      const categories = chunk.value;
      categories.id = categories.id ?? 0;
      categories.kategorie_id = categories.kategorie_id ?? 0;
      categories.sicherungszeit = categories.sicherungszeit ?? '';

      const res = await redis.store(
        `newsCategoriesMatflix10:${count}`,
        categories,
      );
      console.log('Redis res', res);
      count++;
    });

    readStream.on('end', async () => {
      console.log('finished reading');
    });
  }

  public async storeNewsCategories() {
    const readStream = fs
      .createReadStream('', 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const newsCategories = chunk.value;

      newsCategories.id = newsCategories.id ?? '';
      newsCategories.kategorie_id = newsCategories.kategorie_id ?? '';
      newsCategories.sicherungszeit = newsCategories.sicherungszeit ?? '';

      const res = await redis.store(`newsCategoriesMatflix10:${newsCategories.id}`, newsCategories);
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading');
    });

  }

  public async storeGroup() {
    const readStream = fs
      .createReadStream('', 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const group = chunk.value;

      group.gruppen_id = group.gruppen_id ?? '';
      group.eltern_id = group.eltern_id ?? '';
      group.gruppe = group.gruppe ?? '';
      group.gruppe_eng = group.gruppe_eng ?? '';
      group.sortidx = group.sortidx ?? '';
      group.sichtbar = group.sichtbar ?? '';
      group.bilddatei = group.bilddatei ?? '';
      group.filter_nachrichten = group.filter_nachrichten ?? '';
      group.filter_kurse = group.filter_kurse ?? '';
      group.sicherungszeit = group.sicherungszeit ?? '';
      group.is_active = group.is_active ?? '';
      group.is_inactive = group.is_inactive ?? '';

      const res = await redis.store(`groupMatflix10:${group.gruppen_id}`, group);
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading');
    });
  }

  public async getNews(req: any) {
    const { limit, offset } = getPaginateOffset(req.page, req.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };

    const key = req.key;
    const data = await redis.get(key, req.query, option);

    return data;
  }
}
