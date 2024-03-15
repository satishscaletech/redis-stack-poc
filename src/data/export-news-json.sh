rm nachrichten.json

clickhouse local -q "SELECT * FROM
  mysql(
    'host:port',
    'DBNAME',
    'nachrichten',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'nachrichten.json'"

gzip -fk nachrichten.json