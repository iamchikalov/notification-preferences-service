CREATE TABLE IF NOT EXISTS default_preferences (
    notification_type TEXT NOT NULL,
    channel           TEXT NOT NULL,
    enabled           BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (notification_type, channel)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id           TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    channel           TEXT NOT NULL,
    enabled           BOOLEAN NOT NULL,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, notification_type, channel)
);

CREATE TABLE IF NOT EXISTS quiet_hours (
    user_id    TEXT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    timezone   TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_policies (
    id                SERIAL PRIMARY KEY,
    notification_type TEXT NOT NULL,
    channel           TEXT NOT NULL,
    region            TEXT NOT NULL,
    enabled           BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (notification_type, channel, region)
);

INSERT INTO default_preferences (notification_type, channel, enabled) VALUES
    ('transactional', 'email', true),
    ('transactional', 'sms',   true),
    ('transactional', 'push',  true),
    ('marketing',     'email', false),
    ('marketing',     'sms',   false),
    ('marketing',     'push',  false)
ON CONFLICT DO NOTHING;
