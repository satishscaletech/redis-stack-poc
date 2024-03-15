rm gruppen.json

./clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'DBNAME',
    'gruppen',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'gruppen.json'"

gzip -fk gruppen.json 
