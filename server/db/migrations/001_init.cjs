/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS postgis`);
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  pgm.createTable("sources", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "text", notNull: true },
    type: { type: "text", notNull: true },
    url: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: { type: "text", notNull: true, unique: true },
    role: { type: "text", notNull: true, default: "viewer" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.sql(`
    CREATE TABLE map_features (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID REFERENCES sources(id),
      category TEXT NOT NULL,
      geom GEOGRAPHY(Point, 4326) NOT NULL,
      properties JSONB NOT NULL DEFAULT '{}',
      confidence REAL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  pgm.sql(
    `CREATE INDEX map_features_geom_idx ON map_features USING GIST (geom)`,
  );
  pgm.sql(
    `CREATE INDEX map_features_category_idx ON map_features (category)`,
  );
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS map_features`);
  pgm.dropTable("users");
  pgm.dropTable("sources");
};
