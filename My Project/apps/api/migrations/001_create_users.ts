import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary();
    t.string('email').notNullable().unique();
    t.string('name');
    t.string('hashed_password').notNullable();
    t.enum('tier', ['free', 'pro']).notNullable().defaultTo('free');
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}

