./clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'DBNAME,
    'gruppen',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'group.json'"
