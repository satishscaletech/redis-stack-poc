rm -rf gruppen.json

./clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'matx-dev',
    'gruppen',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'gruppen.json'"

gzip -fk gruppen.json 
