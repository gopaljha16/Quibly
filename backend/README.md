# migration

npx prisma migrate dev (run ) ---> (prisma code raw sql code)

/// name your migration here!

OR

npx prisma migrate dev --name "$name_you_migration" (migrate + name)

# generate

npx prisma generate   (-->db present)

# studio ( to view database )

npx prisma studio

# deploy cmd ( to inject current schema in new db )

npx prisma migrate deploy