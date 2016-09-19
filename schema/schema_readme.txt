# Had to change /etc/postgresql/9.5/main/pg_hba.conf line from md50->password
local   all             all                                     password

psql -c "CREATE USER nex WITH PASSWORD '[passwd]'"

psql -U postgres postgres -c "CREATE DATABASE sgd WITH OWNER nex ENCODING 'UTF8'"
psql -U postgres postgres -c "CREATE ROLE CURATOR"

psql -U postgres postgres -c "CREATE USER otto WITH PASSWORD '[passwd]'"
psql -U postgres postgres -c "GRANT CURATOR to otto"

psql -U postgres postgres -c "CREATE SCHEMA AUTHORIZATION nex"

psql -U postgres postgres -c "GRANT USAGE ON SCHEMA nex TO CURATOR"
psql -U postgres postgres -c "ALTER DEFAULT PRIVILEGES FOR ROLE nex GRANT EXECUTE ON FUNCTIONS to CURATOR"

psql -d sgd -U nex

\i nex2-sequences.sql
\i nex2-basic-tables.sql
\i nex2-ontology-tables.sql
\i nex2-dbentity-tables.sql
\i nex2-object-tables.sql
\i nex2-annotation-tables.sql
\i nex2-curation-tables.sql
\i nex2-archive-tables.sql
\i nex2-grants.sql
\i nex2-constraints.sql

\i nex2-insertfunctions.sql
\i nex2-checkfunctions.sql
\i nex2-makefunctions.sql

\i nex2-basic-triggers.sql
\i nex2-ontology-triggers.sql
\i nex2-dbentity-triggers.sql
\i nex2-object-triggers.sql
\i nex2-annotation-triggers.sql
\i nex2-curation-triggers.sql
\i nex2-archive-triggers.sql
