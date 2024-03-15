rm kategorien.json

clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'DBNAME',
    'kategorien',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'kategorien.json'"

gzip -fk kategorien.json
