# Database Design

## Questions

+ What a migration is, and why up and down both matter
+ The difference between migrations and seeds
+ Why lookup tables were used for stages, modes, and PR types, but CHECK constraints for roles and user types
+ Which rules the database enforces and which the application will enforce
+ The results of your constraint tests

## Answers

1. A migration is a way to manage and apply to your database schema. It will always come in pair the `up` and `down`. `up` is when you add a new column to a table, and `down` is when you can reverse it to its original structure.
