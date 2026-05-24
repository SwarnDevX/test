import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary();
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    t.text('idea_text').notNullable();
    t.string('project_name').notNullable();
    t.enum('status', ['generating', 'completed', 'failed']).defaultTo('generating');
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('projects');
}

