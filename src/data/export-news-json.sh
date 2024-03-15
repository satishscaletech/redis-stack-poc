./clickhouse local -q "SELECT * FROM
  mysql(
    'host:port',
    'DBNAME,
    'nachrichten',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'news.json'"



