rm -rf nachrichten.json

./clickhouse local -q "SELECT * FROM
  mysql(
    'host:port',
    'matx-dev',
    'nachrichten',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'nachrichten.json'"

gzip -fk nachrichten.json