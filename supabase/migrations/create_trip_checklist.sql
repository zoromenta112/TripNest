create table if not exists public.trip_checklist (
    id uuid primary key default gen_random_uuid(),

    trip_id uuid not null
        references public.trips(id)
        on delete cascade,

    item_key text not null,

    completed_at timestamptz null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint trip_checklist_trip_item_unique
        unique (trip_id, item_key)
);
alter table public.trip_checklist
add constraint trip_checklist_item_key_check
check (
    item_key in (
        'travel_documents',
        'flight_confirmation',
        'accommodation',
        'esim',
        'local_transport',
        'emergency_information'
    )
);
create index if not exists trip_checklist_trip_id_idx
on public.trip_checklist (trip_id);