/home/nishaltaylor/Downloads/clickhouse local -q "SELECT * FROM
   mysql(
    'host:port',
    'DBNAME,
    'kategorien',
    'USER',
    'DBPASS'
)
INTO OUTFILE '/home/nishaltaylor/workspace/projects/redis-stack-poc/redis-stack-poc/src/data/kategorien.json'"