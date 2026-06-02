create table if not exists people (
  id text primary key,
  name text not null,
  profile_photo_path text not null,
  embedding jsonb not null,
  created_at timestamptz not null
);

create table if not exists photos (
  id text primary key,
  file_path text not null,
  uploaded_by_person_id text references people(id) on delete set null,
  uploaded_at timestamptz not null
);

create table if not exists face_detections (
  id text primary key,
  photo_id text not null references photos(id) on delete cascade,
  embedding jsonb not null,
  bounding_box jsonb not null
);

create index if not exists photos_uploaded_by_person_id_idx on photos(uploaded_by_person_id);
create index if not exists photos_uploaded_at_idx on photos(uploaded_at desc);
create index if not exists face_detections_photo_id_idx on face_detections(photo_id);
