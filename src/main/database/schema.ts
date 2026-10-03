export const SCHEMA = `
CREATE TABLE IF NOT EXISTS diary (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    password_hash   TEXT NOT NULL,
    salt            TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    backup_version  INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS entries (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    date        TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
    id          TEXT PRIMARY KEY,
    entry_id    TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    content     TEXT NOT NULL DEFAULT '',
    iv          TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
    id              TEXT PRIMARY KEY,
    page_id         TEXT NOT NULL,
    entry_id        TEXT NOT NULL,
    media_type      TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
    file_path       TEXT NOT NULL,
    original_name   TEXT,
    mime_type       TEXT,
    width           REAL DEFAULT 100,
    height          REAL DEFAULT 100,
    x_position      REAL DEFAULT 0,
    y_position      REAL DEFAULT 0,
    rotation        REAL DEFAULT 0,
    file_size       INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
`;
