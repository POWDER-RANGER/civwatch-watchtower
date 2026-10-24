/**
 * Roadmap P2-2: persist submitted map features and citizen reports.
 *
 * - map_features.source_ref: free-text source label from submissions. The
 *   existing source_id column is a UUID foreign key to `sources` and cannot
 *   hold the string identifiers the API accepts.
 * - reports: citizen reports, moderated before publication (status).
 *
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE map_features ADD COLUMN source_ref TEXT`);
  pgm.sql(`
    CREATE TABLE reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      category TEXT NOT NULL,
      title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
      body TEXT CHECK (body IS NULL OR char_length(body) <= 10000),
      geom GEOGRAPHY(Point, 4326) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  pgm.sql(`CREATE INDEX reports_status_created_idx ON reports (status, created_at DESC)`);
  pgm.sql(`CREATE INDEX reports_geom_idx ON reports USING GIST (geom)`);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS reports`);
  pgm.sql(`ALTER TABLE map_features DROP COLUMN IF EXISTS source_ref`);
};
