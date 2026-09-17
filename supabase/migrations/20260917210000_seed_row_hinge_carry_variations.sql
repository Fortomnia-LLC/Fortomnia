insert into public.exercise_variants (
  exercise_id, name, grip, attachment, stance, laterality,
  execution_style, aliases, is_default, sort_order
)
select
  exercises.id, variation.name, variation.grip, variation.attachment,
  variation.stance, variation.laterality, variation.execution_style,
  variation.aliases, false, variation.sort_order
from public.exercises
join (
  values
    ('Barbell Row', 'Standard Barbell', 'overhand', 'straight barbell', 'bent-over', 'bilateral', 'standard', array['bent over barbell row'], 10),
    ('Barbell Row', 'Cambered Bar', 'overhand', 'cambered bar', 'bent-over', 'bilateral', 'specialty bar', array['cambered bar row'], 20),
    ('Barbell Row', 'Swiss / Football Bar', 'neutral', 'multi-grip bar', 'bent-over', 'bilateral', 'neutral grip', array['football bar row','swiss bar row'], 30),
    ('Barbell Row', 'Axle Bar', 'overhand', 'axle bar', 'bent-over', 'bilateral', 'thick bar', array['axle row','fat bar row'], 40),
    ('Seal Row', 'Standard Barbell', 'overhand', 'straight barbell', 'prone bench', 'bilateral', 'standard', array['barbell seal row'], 10),
    ('Seal Row', 'Cambered Bar', 'overhand', 'cambered bar', 'prone bench', 'bilateral', 'specialty bar', array['cambered seal row'], 20),
    ('Seal Row', 'Swiss / Football Bar', 'neutral', 'multi-grip bar', 'prone bench', 'bilateral', 'neutral grip', array['football bar seal row'], 30),
    ('Deadlift', 'Standard Barbell', 'mixed', 'straight barbell', 'standing', 'bilateral', 'conventional', array['conventional barbell deadlift'], 10),
    ('Deadlift', 'Deadlift Bar', 'mixed', 'deadlift bar', 'standing', 'bilateral', 'flexible bar', array['texas deadlift bar deadlift'], 20),
    ('Deadlift', 'Axle Bar', 'mixed', 'axle bar', 'standing', 'bilateral', 'thick bar', array['axle deadlift','fat bar deadlift'], 30),
    ('Romanian Deadlift', 'Standard Barbell', 'overhand', 'straight barbell', 'standing', 'bilateral', 'standard', array['barbell rdl'], 10),
    ('Romanian Deadlift', 'Deadlift Bar', 'overhand', 'deadlift bar', 'standing', 'bilateral', 'flexible bar', array['deadlift bar rdl'], 20),
    ('Romanian Deadlift', 'Axle Bar', 'overhand', 'axle bar', 'standing', 'bilateral', 'thick bar', array['axle rdl'], 30),
    ('Farmer Carry', 'Dumbbells', 'neutral', 'dumbbells', 'walking', 'bilateral', 'standard', array['dumbbell farmers walk'], 10),
    ('Farmer Carry', 'Farmer Handles', 'neutral', 'farmer handles', 'walking', 'bilateral', 'strongman', array['farmers handles carry'], 20),
    ('Farmer Carry', 'Trap Bar', 'neutral', 'trap bar', 'walking', 'bilateral', 'strongman', array['trap bar farmer carry'], 30),
    ('Farmer Carry', 'Suitcase Single-Arm', 'neutral', 'single handle', 'walking', 'unilateral', 'suitcase carry', array['suitcase carry'], 40)
) as variation(exercise_name, name, grip, attachment, stance, laterality, execution_style, aliases, sort_order)
  on lower(exercises.name) = lower(variation.exercise_name)
where exercises.owner_id is null
on conflict (exercise_id, name) do update set
  grip = excluded.grip,
  attachment = excluded.attachment,
  stance = excluded.stance,
  laterality = excluded.laterality,
  execution_style = excluded.execution_style,
  aliases = excluded.aliases,
  sort_order = excluded.sort_order;
