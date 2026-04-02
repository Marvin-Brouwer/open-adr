# Typescript aliases not working

An attempt was made to give an alias to the tests project.\
So, the source files can be accessed like `-/src/*.mts` or maybe even add a shortcut to mocks.\
However, eslint wasn't having it.

At some point `eslint-import-resolver-alias` fixed the alias issues, but from that point on we got no-unsafe-assignment everywhere.

Once we finalize the repo, this may become a hacktoberfest issue.
