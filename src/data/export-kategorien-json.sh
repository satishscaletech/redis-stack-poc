./clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'DBNAME,
    'kategorien',
    'USER',
    'DBPASS'
)
INTO OUTFILE 'kategorien.json'"