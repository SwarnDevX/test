import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('analytics_events', (t) => {
    t.uuid('id').primary();
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable();
    t.string('event_type').notNullable();
    t.jsonb('payload').defaultTo('{}');
    t.timestamps(true, true);
    t.index(['project_id', 'event_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('analytics_events');
}

