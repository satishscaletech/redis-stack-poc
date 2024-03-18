rm -rf kategorien.json

./clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'matx-dev',
    'kategorien',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'kategorien.json'"

gzip -fk kategorien.json
