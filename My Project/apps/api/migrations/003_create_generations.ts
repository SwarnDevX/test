import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('generations', (t) => {
    t.uuid('id').primary();
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    t.jsonb('output').notNullable();
    t.integer('tokens_used').defaultTo(0);
    t.boolean('from_cache').defaultTo(false);
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('generations');
}

