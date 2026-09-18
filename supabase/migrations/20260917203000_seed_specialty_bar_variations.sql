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
    ('Overhead Press', 'Standard Barbell', 'overhand', 'straight barbell', 'standing', 'bilateral', 'standard', array['barbell overhead press'], 10),
    ('Overhead Press', 'Swiss / Football Bar', 'neutral', 'multi-grip bar', 'standing', 'bilateral', 'neutral grip', array['football bar overhead press','swiss bar overhead press'], 20),
    ('Overhead Press', 'Axle Bar', 'overhand', 'axle bar', 'standing', 'bilateral', 'thick bar', array['fat bar overhead press'], 30),
    ('Overhead Press', 'Log', 'neutral', 'strongman log', 'standing', 'bilateral', 'strongman press', array['log press'], 40),
    ('Overhead Press', 'Bamboo / Earthquake Bar', 'overhand', 'bamboo bar', 'standing', 'bilateral', 'oscillating load', array['earthquake bar overhead press'], 50),
    ('Back Squat', 'Standard Barbell', 'overhand', 'straight barbell', 'standing', 'bilateral', 'standard', array['barbell back squat'], 10),
    ('Back Squat', 'Safety Squat Bar', 'neutral', 'safety squat bar', 'standing', 'bilateral', 'specialty bar', array['ssb squat','safety bar squat'], 20),
    ('Back Squat', 'Buffalo Bar', 'overhand', 'buffalo bar', 'standing', 'bilateral', 'specialty bar', array['duffalo bar squat'], 30),
    ('Back Squat', 'Cambered Bar', 'overhand', 'cambered bar', 'standing', 'bilateral', 'specialty bar', array['cambered squat bar'], 40),
    ('Good Morning', 'Standard Barbell', 'overhand', 'straight barbell', 'standing', 'bilateral', 'standard', array['barbell good morning'], 10),
    ('Good Morning', 'Safety Squat Bar', 'neutral', 'safety squat bar', 'standing', 'bilateral', 'specialty bar', array['ssb good morning'], 20),
    ('Good Morning', 'Cambered Bar', 'overhand', 'cambered bar', 'standing', 'bilateral', 'specialty bar', array['cambered bar good morning'], 30),
    ('Barbell Hip Thrust', 'Standard Barbell', null, 'straight barbell', 'bench-supported', 'bilateral', 'standard', array['barbell hip thrust'], 10),
    ('Barbell Hip Thrust', 'Safety Squat Bar', null, 'safety squat bar', 'bench-supported', 'bilateral', 'specialty bar', array['ssb hip thrust'], 20)
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
