import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import * as zlib from 'zlib';
import { difference, intersection } from 'lodash';
import redis from '../../lib/redis';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import { createPagination, getPaginateOffset } from '../../helper';
import {
  JSON_FILE_PATH,
  REDIS_MATFLIX_INDEX,
  FREEMIUM,
  TOTAL_CATEGORY,
  REDIS_EXPORT_KEY,
} from '../../constant';
import { newsResponseDto } from './dto/news.res.dto';
import * as moment from 'moment';
import { tagResponseDto } from './dto/tag.res.dto';

import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { ignore } from 'stream-json/filters/Ignore';
import { streamValues } from 'stream-json/streamers/StreamValues';

@Injectable()
export class NewsService {
  public async storeNews() {
    const readStream = await fs
      .createReadStream(`${JSON_FILE_PATH.NEWS_MATFLIX}`, 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const news = chunk.value;
      news.id = news.id;
      news.datum = news.datum ? new Date(news.datum).getTime() : null;
      news.sprache = news.sprache ?? null;
      news.source_code = news.source_code ?? null;
      news.grusel = news.grusel
        ? news.grusel
            .trim()
            .split(' ')
            .filter((d: string) => d)
        : [];
      //news.grusel = news.grusel;
      news.bild = news.bild ?? null;
      news.bild_info = news.bild_info ?? null;
      news.titel = news.titel ?? null;
      news.einleitung = news.einleitung ?? null;
      news.inhalt = news.inhalt ?? null;
      news.html = news.html ?? null;
      news.autor = news.auto ?? null;
      news.quelle = news.quelle ?? null;
      news.externe_id = news.externe_id;
      news.sicherungszeit = news.sicherungszeit ?? null;
      news.tags =
        news.grusel.length > 0
          ? JSON.stringify(await this.storeTag(news.grusel))
          : 'false';
      news.categories =
        news.grusel.length > 0
          ? await this.storeCategoriesIDs(news.grusel)
          : [];
      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}:${news.id}`,
        news,
      );
      console.info('Redis news response: ', res);
    });

    readStream.on('end', function () {
      console.log('finished reading news');
    });
  }

  public async storeTag(grusel: string[]) {
    try {
      const cat_data = [];
      let news_grusel: any;
      if (grusel.length) {
        news_grusel = grusel.filter(
          (tag: string) =>
            !tag.includes('-') &&
            !tag.includes('#') &&
            tag !== ' ' &&
            tag !== '  ' &&
            !/[^\w\s]/.test(tag) &&
            tag,
        );
      }
      if (!news_grusel.length) {
        return false;
      }
      if (grusel[0] == '') {
        return false;
      } else {
        const news_cat: any = await this.getAllCategoriesByQuery({
          query: `(@grusel: {${news_grusel
            .flat()
            .join(' | ')}}) (@sichtbar: [1 1]) (@is_news_delete: [0 0])`,
        });
        for (const categories of news_cat) {
          const filtered_grusel = categories.grusel.filter((tag: any) => tag);
          let grusel_pair = [];
          let is_news_cat_grusel_match = false;
          if (filtered_grusel.length < 3) {
            grusel_pair = filtered_grusel;
            const grusel_intersection = intersection(news_grusel, grusel_pair);
            if (grusel_pair.length <= grusel_intersection.length) {
              is_news_cat_grusel_match = true;
            }
          } else if (filtered_grusel.length) {
            const new_grusel_arr = filtered_grusel.slice(1);
            const grusel_pair = new_grusel_arr.map((tag: any) => {
              return [filtered_grusel[0], tag];
            });
            is_news_cat_grusel_match = grusel_pair.some((grusel: any) => {
              const grusel_intersection = intersection(news_grusel, grusel);
              if (grusel_intersection.length === grusel.length) {
                return true;
              }
            });
          }

          if (is_news_cat_grusel_match) {
            const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

            categories.parentGroup = await this.getParentGroup(group_id_query);
            cat_data.push(new tagResponseDto(categories));
          }
        }

        //Add freemium category if applicable
        const freemium_cat = await this.getFreemiumCategory(news_grusel);

        if (freemium_cat) {
          const group_id_query = `@gruppen_id: [${freemium_cat.gruppen_id} ${freemium_cat.gruppen_id}]`;

          freemium_cat.parentGroup = await this.getParentGroup(group_id_query);

          cat_data.push(new tagResponseDto(freemium_cat));
        }

        if (cat_data.length) {
          return cat_data;
        } else {
          return false;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async storeCategoriesIDs(grusel) {
    try {
      const catIds = [];
      let news_grusel: any;
      if (grusel.length) {
        news_grusel = grusel.filter(
          (tag: string) =>
            !tag.includes('-') &&
            !tag.includes('#') &&
            tag !== ' ' &&
            tag !== '  ' &&
            !/[^\w\s]/.test(tag) &&
            tag,
        );
      }
      if (!news_grusel.length) {
        return [];
      }
      if (grusel[0] == '') {
        return [];
      } else {
        const news_cat: any = await this.getAllCategoriesByQuery({
          query: `(@grusel: {${news_grusel
            .flat()
            .join(' | ')}}) (@sichtbar: [1 1]) (@is_news_delete: [0 0])`,
        });
        for (const categories of news_cat) {
          const filtered_grusel = categories.grusel.filter((tag: any) => tag);
          let grusel_pair = [];
          let is_news_cat_grusel_match = false;
          if (filtered_grusel.length < 3) {
            grusel_pair = filtered_grusel;
            const grusel_intersection = intersection(news_grusel, grusel_pair);
            if (grusel_pair.length <= grusel_intersection.length) {
              is_news_cat_grusel_match = true;
            }
          } else if (filtered_grusel.length) {
            const new_grusel_arr = filtered_grusel.slice(1);
            const grusel_pair = new_grusel_arr.map((tag: any) => {
              return [filtered_grusel[0], tag];
            });
            is_news_cat_grusel_match = grusel_pair.some((grusel: any) => {
              const grusel_intersection = intersection(news_grusel, grusel);
              if (grusel_intersection.length === grusel.length) {
                return true;
              }
            });
          }

          if (is_news_cat_grusel_match) {
            const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

            // categories.parentGroup = await this.getParentGroup(group_id_query);
            console.log('categories', categories);
            catIds.push(categories.kategorie_id);
          }
        }

        //Add freemium category if applicable
        const freemium_cat = await this.getFreemiumCategory(news_grusel);

        if (freemium_cat) {
          const group_id_query = `@gruppen_id: [${freemium_cat.gruppen_id} ${freemium_cat.gruppen_id}]`;

          // freemium_cat.parentGroup = await this.getParentGroup(group_id_query);

          catIds.push(freemium_cat.kategorie_id);
        }
        if (catIds.length) {
          return catIds;
        } else {
          return [];
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async storeCategories() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.CATEGORIES_MATFLIX, 'utf-8')
      .pipe(StreamArray.withParser());
    readStream.on('data', async (chunk) => {
      const categories = chunk.value;

      categories.kategorie_id = categories.kategorie_id ?? 0;
      categories.gruppen_id = categories.gruppen_id ?? 0;
      categories.gruppe = categories.gruppe ?? '';
      categories.kategorie = categories.kategorie ?? '';
      categories.sprache = categories.sprache ?? '';
      categories.quelle = categories.quelle ?? '';
      categories.fid = categories.fid ?? 0;
      categories.grusel = categories.grusel
        ? categories.grusel.split(' ')
        : [''];
      categories.sichtbar = categories.sichtbar ?? 0;
      categories.sicherungszeit = categories.sicherungszeit ?? '';
      categories.kategorie_eng = categories.kategorie_eng ?? '';
      categories.gruppe_eng = categories.gruppe_eng ?? '';
      categories.is_news_delete = categories.is_news_delete ?? 0;

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}:${chunk.key + 1}`,
        categories,
      );
      console.log('Redis categories response: ', res);
    });

    readStream.on('end', async () => {
      console.log('finished reading categories');
    });
  }

  public async storeNewsCategories() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.NEWS_CATEGORIES_MATFLIX, 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const newsCategories = chunk.value;

      newsCategories.id = newsCategories.id ?? '';
      newsCategories.kategorie_id = newsCategories.kategorie_id ?? '';
      newsCategories.sicherungszeit = newsCategories.sicherungszeit ?? '';

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}:${newsCategories.id}`,
        newsCategories,
      );
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading news categories');
    });
  }

  public async storeGroup() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.GROUP_MATFLIX, 'utf-8')
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

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}:${group.gruppen_id}`,
        group,
      );
      console.log('Redis group response: ', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading group');
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
  public async getCategories(req: any) {
    console.log('request data', req);

    const { limit, offset } = getPaginateOffset(req.page, req.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };

    const key = req.key;
    const data = await redis.get(key, req.query, {});
    console.log('data', data);

    return data;
  }

  public async getNewsCategories1(req: any) {
    const idx = 'idx:' + REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX;
    const data = await redis.get(idx, req.query, { from: 1, size: 100000 });

    const cat_ids_query = data.documents.map((doc) => {
      return `(@kategorie_id: [${doc.value.kategorie_id} ${doc.value.kategorie_id}])`;
    });

    const query = cat_ids_query.join('|');
    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      query,
      {},
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getNewsCategories2(req: any) {
    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      req.query,
      {},
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getAllCategoriesByQuery(req: any) {
    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      req.query,
      {
        LIMIT: {
          from: 0,
          size: TOTAL_CATEGORY,
        },
      },
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getNewsCategories(req: any) {
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

  public async getGroup(req: any) {
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

  public async getNewsByGroup(dto: any) {
    // Retrieve all groups and sub-groups
    const groups = await this.getAllGroups(dto.groupId);
    // Extract group IDs for query
    const groupIds = groups.map(
      (group) =>
        `(@gruppen_id: [${group.value.gruppen_id} ${group.value.gruppen_id}])`,
    );

    const categories = await redis.get(
      `idx:${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}`,
      groupIds.join('|'),
      { LIMIT: { from: 0, size: TOTAL_CATEGORY } },
    );
    const categories_ids: any[] = categories.documents.map((doc) => {
      return doc.value.kategorie_id;
    });

    const result: {
      kategorie_id: number[];
      page: number;
      recordPerPage: number;
    } = {
      kategorie_id: categories_ids,
      page: dto.page,
      recordPerPage: dto.recordPerPage,
    };
    const news = await this.getNewsByCatId(result);
    return { data: news };
  }

  public async getAllGroups(groupId) {
    const key = `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`;
    const group_query = `@gruppen_id: [${groupId} ${groupId}]`;

    const groups = await redis.get(key, group_query, { from: 1, size: 10 });

    let eltern_ids = [];

    groups.documents.forEach((groupDoc) => {
      if (groupDoc.value.eltern_id !== 0) {
        eltern_ids.push(groupDoc.value.eltern_id);
      }
    });

    let elternIdsFieldQuery = eltern_ids.map((doc) => {
      return `(@gruppen_id:[${doc} ${doc}])`;
    });

    const elternIdsAsGroupId = elternIdsFieldQuery.join('|');

    const childGroups = await redis.get(key, elternIdsAsGroupId, {});

    let allGroups = groups.documents;

    for (const childGroupDoc of childGroups.documents) {
      const childGroupId = childGroupDoc.value.gruppen_id;
      const recursiveGroups = await this.getAllGroups.call(this, childGroupId);
      allGroups = allGroups.concat(recursiveGroups);
    }

    return allGroups;
  }

  public async getNewsByQuery(dto: any) {
    const { limit, offset } = getPaginateOffset(dto.page, dto.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset,
        size: limit,
      },
      SORTBY: {
        BY: 'datum',
        DIRECTION: 'DESC',
      },
    };

    const groups = await redis.get(
      `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`,
      dto.query,
      option,
    );

    return groups;
  }

  public async getNewsByCatId(dto: {
    kategorie_id: number[];
    page: number;
    recordPerPage: number;
  }) {
    //console.log(dy)
    const { limit, offset, pagenumber } = getPaginateOffset(
      dto.page,
      dto.recordPerPage,
    );
    const category_query = dto.kategorie_id.map((id) => {
      return `(@kategorie_id: [${id} ${id}])`;
    });
    const categories = await this.getAllCategoriesByQuery({
      query: category_query.join(' | '),
    });

    const grusel_query = categories.map(
      (category: { kategorie_id: number; grusel: [] }) => {
        if (category.grusel.length < 3) {
          const tagQuery = category.grusel.map((tags: string) => {
            return `@grusel: {${tags}}`;
          });
          return `(${tagQuery.join(' ')})`;
        } else if (category.grusel.length > 2) {
          // const results = this.pairCombination(category.grusel);
          const category_grusel: [] = category.grusel;
          const new_grusel_arr = category_grusel.slice(1);
          const results = new_grusel_arr.map((tag) => {
            return [category_grusel.slice(0, 1)[0], tag];
          });
          const tag_query = results.map((result: any) => {
            const result_query = result.map((tag) => {
              return `@grusel: {${tag}}`;
            });

            return `(${result_query.join(' ')})`;
          });
          return `(${tag_query.join('|')})`;
        }
      },
    );

    const news_data = await this.getNewsByQuery({
      query: grusel_query.join('|'),
      ...dto,
    });

    // return news_data;
    for (const news of news_data.documents) {
      const cat_data = [];

      const newsObj: any = news.value;

      const filtered_news_grusel = newsObj.grusel.filter((tag: string) => tag);
      const news_grusel = filtered_news_grusel.map((tag: string) => {
        let t = [];
        if (tag.includes('-')) {
          t.push(tag.replace(/-/g, '\\-'));
        } else {
          t.push(tag);
        }
        return t.join('');
      });
      // console.log(news_grusel);

      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `(@grusel: {${news_grusel
          .flat()
          .join(' | ')}}) (@sichtbar: [1 1]) (@is_news_delete: [0 0])`,
      });

      // console.log(news_cat);

      for (const categories of news_cat) {
        const filtered_grusel = categories.grusel.filter((tag) => tag);
        let grusel_pair = [];
        let is_news_cat_grusel_match = false;
        if (filtered_grusel.length < 3) {
          grusel_pair = filtered_grusel;
          const grusel_intersection = intersection(news_grusel, grusel_pair);
          if (grusel_pair.length <= grusel_intersection.length) {
            is_news_cat_grusel_match = true;
          }
        } else if (filtered_grusel.length) {
          // grusel_pair = this.pairCombination(filtered_grusel);
          const new_grusel_arr = filtered_grusel.slice(1);
          const grusel_pair = new_grusel_arr.map((tag) => {
            return [filtered_grusel[0], tag];
          });
          is_news_cat_grusel_match = grusel_pair.some((grusel) => {
            const grusel_intersection = intersection(news_grusel, grusel);
            if (grusel_intersection.length === grusel.length) {
              return true;
            }
          });
        }

        if (is_news_cat_grusel_match) {
          const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

          categories.parentGroup = await this.getParentGroup(group_id_query);

          cat_data.push(categories);
        }
      }

      //Add freemium category if applicable
      const freemium_cat = await this.getFreemiumCategory(news_grusel);

      if (freemium_cat) {
        const group_id_query = `@gruppen_id: [${freemium_cat.gruppen_id} ${freemium_cat.gruppen_id}]`;

        freemium_cat.parentGroup = await this.getParentGroup(group_id_query);

        cat_data.push(freemium_cat);
      }

      news.value['tags'] = cat_data;
    }
    const news_res = news_data.documents.map((doc: any) => {
      doc.value.grusel = doc.value.grusel?.join(' ');
      return new newsResponseDto(doc.value);
    });
    //return { data: news_res };
    return createPagination(news_data.total, pagenumber, limit, news_res);
  }

  public async getParentGroup(group_id_query: string) {
    let eltern_id = null;
    let groupRes = [];

    while (eltern_id != 0) {
      const group = await redis.get(
        `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`,
        group_id_query,
        { LIMIT: { from: 0, size: 1 } },
      );
      groupRes = group.documents.map((doc) => doc.value);
      eltern_id = groupRes?.[0]?.eltern_id ?? 0;
      group_id_query = `@gruppen_id: [${groupRes?.[0]?.eltern_id} ${groupRes?.[0]?.eltern_id}]`;
    }

    return groupRes;
  }

  public async getNewsCategoriesByGruse(news, categories) {
    const filtered_grusel = news.grusel.filter((tag) => tag);
    const grusel_arr = [];
    let grusel_diff = [];
    const grusel_intsec_cat_arr = [];
    categories.forEach((category) => {
      grusel_arr.push(category.grusel.filter((tag) => tag));
    });

    grusel_diff = difference(filtered_grusel, grusel_arr.flat());

    const grusel_diff_query = grusel_diff.map((tag) => `(@grusel: {${tag}})`);

    grusel_arr.forEach((grusel) => {
      const intersection_arr = intersection(filtered_grusel, grusel);

      if (intersection_arr.length) {
        grusel_intsec_cat_arr.push(intersection_arr);
      }
    });

    const grusel_intsec_query = grusel_intsec_cat_arr.map((grusel) => {
      if (grusel.length < 3) {
        const tagQuery = grusel.map((tags) => {
          return `@grusel: {${tags}}`;
        });
        return `(${tagQuery.join(' ')})`;
      } else {
        const results = this.pairCombination(grusel);
        const tag_query = results.map((result: any) => {
          const result_query = result.map((tag) => {
            return `@grusel: {${tag}}`;
          });

          return `(${result_query.join(' ')})`;
        });
        return `(${tag_query.join('|')})`;
      }
    });

    grusel_intsec_query.push(...grusel_diff_query);

    return grusel_intsec_query.join('|');
  }

  private async getFreemiumCategory(news_grusel: string[]) {
    let category = null;
    const grusel_intersection = intersection(news_grusel, FREEMIUM);
    if (grusel_intersection.length) {
      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `(@kategorie_id: [115 115]) (@is_news_delete: [0 0])`,
      });

      //categories = news_cat[0];
      category = news_cat[0];
    }

    return category;
  }

  private pairCombination(data) {
    const result = [];

    // Generate pairs
    for (let i = 2; i <= data.length; i++) {
      const pairs = this.combination(data, i);
      result.push(...pairs);
    }

    return result;
  }

  public combination(data, length, prefix = []) {
    if (length === 0) {
      return [prefix];
    }

    return data.flatMap((v, i) =>
      this.combination(data.slice(i + 1), length - 1, [...prefix, v]),
    );
  }

  public async getNewsBySearch(requestDto: any) {
    console.log(requestDto);
    const key = `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`;
    const trimWord = requestDto.word.trim();
    const replaceWord = trimWord.replace(/ ([^A-Za-z0-9()]+)/g, ' ');
    const startTimestamp = moment(new Date()).subtract(3, 'months').unix();
    const endTimestamp = moment(new Date()).add(1, 'days').unix();
    const replaceString = replaceWord
      .replace(/([^A-Za-z0-9()]+)/g, ' ')
      .replace(')', '")"')
      .replace('(', '"("')
      .trim()
      .replace(/ /g, ' +')
      .replace(/'/g, "''");
    const query = `(@inhalt: ${replaceString}) | (@titel: ${replaceString})  & (@datum: [${startTimestamp}000 ${endTimestamp}000])`;
    console.log(query);

    const data = await redis.get(key, query, {
      LIMIT: { from: 0, size: 100 },
      SORTBY: {
        BY: 'datum',
        DIRECTION: 'DESC',
      },
    });
    return data.documents.map((doc) => {
      return doc.value;
    });
  }
  public async storeNewsDataUsingScript() {
    const lastExportedDataDate = await redis.getKey(
      REDIS_EXPORT_KEY.NEWS_EXPORTED_AT,
    );
    if (lastExportedDataDate) {
      const pipeline = chain([
        fs.createReadStream(`${process.cwd()}/nachrichten.json.gz`),
        zlib.createGunzip(),
        parser(),
        pick({ filter: 'data' }),
        ignore({ filter: /\b_meta\b/i }),
        streamValues(),
        (data) => {
          return data?.value;
        },
      ]);

      let counter = 0;
      pipeline.on('data', async (chunk: any) => {
        const news = chunk;
        news.id = news.id;
        news.datum = news.datum ? new Date(news.datum).getTime() : null;
        news.sprache = news.sprache ?? null;
        news.source_code = news.source_code ?? null;
        news.grusel = news.grusel
          ? news.grusel
              .trim()
              .split(' ')
              .filter((d: string) => d)
          : [];
        //news.grusel = news.grusel;
        news.bild = news.bild ?? null;
        news.bild_info = news.bild_info ?? null;
        news.titel = news.titel ?? null;
        news.einleitung = news.einleitung ?? null;
        news.inhalt = news.inhalt ?? null;
        news.html = news.html ?? null;
        news.autor = news.auto ?? null;
        news.quelle = news.quelle ?? null;
        news.externe_id = news.externe_id;
        news.sicherungszeit = news.sicherungszeit ?? null;
        news.tags =
          news.grusel.length > 0
            ? JSON.stringify(await this.storeTag(news.grusel))
            : 'false';
        news.categories =
          news.grusel.length > 0
            ? await this.storeCategoriesIDs(news.grusel)
            : [];
        const res = await redis.store(
          `${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}:${news.id}`,
          news,
        );
        console.info('Redis news response: ', res);
        ++counter;
      });
      pipeline.on('end', () => console.log(`Total news count: ${counter}.`));
    } else {
      return;
    }
  }

  public async storeCategoriesDatausingScript() {
    const lastExportedDataDate = await redis.getKey(
      REDIS_EXPORT_KEY.KATEGORIEN_EXPORTED_AT,
    );
    if (lastExportedDataDate) {
      const pipeline = chain([
        fs.createReadStream(`${process.cwd()}/kategorien.json.gz`),
        zlib.createGunzip(),
        parser(),
        pick({ filter: 'data' }),
        ignore({ filter: /\b_meta\b/i }),
        streamValues(),
        (data) => {
          return data?.value;
        },
      ]);
      pipeline.on('data', async (chunk: any) => {
        const categories = chunk;

        categories.kategorie_id = categories.kategorie_id ?? 0;
        categories.gruppen_id = categories.gruppen_id ?? 0;
        categories.gruppe = categories.gruppe ?? '';
        categories.kategorie = categories.kategorie ?? '';
        categories.sprache = categories.sprache ?? '';
        categories.quelle = categories.quelle ?? '';
        categories.fid = categories.fid ?? 0;
        categories.grusel = categories.grusel
          ? categories.grusel.split(' ')
          : [''];
        categories.sichtbar = categories.sichtbar ?? 0;
        categories.sicherungszeit = categories.sicherungszeit ?? '';
        categories.kategorie_eng = categories.kategorie_eng ?? '';
        categories.gruppe_eng = categories.gruppe_eng ?? '';
        categories.is_news_delete = categories.is_news_delete ?? 0;

        const res = await redis.store(
          `${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}:${categories.kategorie_id}`,
          categories,
        );
        console.log('Redis categories response: ', res);
      });

      pipeline.on('end', async () => {
        console.log('finished reading categories');
      });
    } else {
      return;
    }
  }

  public async storeGroupsUsingScript() {
    const lastExportedDataDate = await redis.getKey(
      REDIS_EXPORT_KEY.GROUPS_EXPORTED_AT,
    );
    if (lastExportedDataDate) {
      const pipeline = chain([
        fs.createReadStream(`${process.cwd()}/gruppen.json.gz`),
        zlib.createGunzip(),
        parser(),
        pick({ filter: 'data' }),
        ignore({ filter: /\b_meta\b/i }),
        streamValues(),
        (data) => {
          return data?.value;
        },
      ]);

      pipeline.on('data', async (chunk: any) => {
        const group = chunk;

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

        const res = await redis.store(
          `${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}:${group.gruppen_id}`,
          group,
        );
        console.log('Redis group response: ', res);
      });

      pipeline.on('end', async () => {
        console.info('finished reading group');
      });
    } else {
      return;
    }
  }
}
