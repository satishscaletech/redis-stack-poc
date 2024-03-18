// export const REDIS_MATFLIX_INDEX = {
//   GROUP_MATFLIX: 'groupMatflix1',
//   CATEGORIES_MATFLIX: 'categoriesMatflix1',
//   NEWS_MATFLIX: 'newsMatflix1',
//   NEWS_CATEGORIES_MATFLIX: 'newsCategoriesMatflix1',
// };

export const REDIS_MATFLIX_INDEX = {
  GROUP_MATFLIX: 'news_groups',
  CATEGORIES_MATFLIX: 'news_categories',
  NEWS_MATFLIX: 'news',
  NEWS_CATEGORIES_MATFLIX: 'newsCategoriesMatflix1',
};

export const REDIS_EXPORT_KEY ={
  NEWS_EXPORTED_AT:'newsExportedAt',
  KATEGORIEN_EXPORTED_AT:'kategorienExportedAt',
  GROUPS_EXPORTED_AT:'groupsExportedAt'
}

export const REDIS_IMPORT_KEY ={
  NEWS_IMPORTED_AT:'newsImportedAt',
  KATEGORIEN_IMPORTED_AT: 'kategorienImportedDAt',
  GROUPS_IMPORTED_AT: 'groupsImportedAt'

}

export const JSON_FILE_PATH = {
  GROUP_MATFLIX: '/home/nishaltaylor/Downloads/gruppen_202403071200.json',
  CATEGORIES_MATFLIX:
    '/home/nishaltaylor/Downloads/kategorien_202403071201.json',
  NEWS_MATFLIX: '/home/nishaltaylor/Downloads/nachrichten_202403071158.json',
  //NEWS_MATFLIX: 'src/test.json',
  NEWS_CATEGORIES_MATFLIX:
    '/home/nishaltaylor/Downloads/nachrichten_x_kategorien_202312271444.json',
};

export const FREEMIUM = [
  'WEBDGEO',
  'WEBENO',
  'WEBSTO',
  'WEBSNO',
  'WEBTNEO',
  'WEBELMO',
  'WEBEIMO',
  'WEBSTAO',
  'WEBSTMO',
  'WEBNEO',
  'WEBNEMO',
  'WEBGENUO',
  'WEBGUFO',
  'WEBVUFO',
  'WEBEURO',
];

export const TOTAL_CATEGORY = 1000;
export const TOTAL_GROUP = 1000;
