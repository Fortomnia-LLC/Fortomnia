insert into public.exercise_variants (
  exercise_id, name, grip, attachment, stance, laterality,
  execution_style, aliases, is_default, sort_order
)
select
  exercises.id, variation.name, variation.grip, variation.attachment,
  variation.stance, variation.laterality, variation.execution_style,
  variation.aliases, variation.is_default, variation.sort_order
from public.exercises
cross join (
  values
    ('Neutral V-Bar', 'neutral', 'v-bar', 'seated', 'bilateral', 'standard', array['close grip cable row','v bar cable row'], true, 10),
    ('Medium Neutral MAG-Style Grip', 'neutral', 'medium neutral handle', 'seated', 'bilateral', 'standard', array['medium neutral cable row','mag grip cable row'], false, 20),
    ('Wide Neutral Bar', 'neutral', 'wide neutral bar', 'seated', 'bilateral', 'standard', array['wide neutral cable row'], false, 30),
    ('Wide Overhand Bar', 'overhand', 'wide straight bar', 'seated', 'bilateral', 'standard', array['wide grip seated cable row','wide overhand cable row'], false, 40),
    ('Underhand Straight Bar', 'underhand', 'straight bar', 'seated', 'bilateral', 'standard', array['reverse grip cable row','supinated cable row'], false, 50),
    ('Rope', 'neutral', 'rope', 'seated', 'bilateral', 'standard', array['rope cable row'], false, 60),
    ('Independent D-Handles', 'neutral', 'independent d-handles', 'seated', 'bilateral', 'independent arms', array['dual handle cable row','independent cable row'], false, 70),
    ('Single-Arm D-Handle', 'neutral', 'd-handle', 'seated', 'unilateral', 'single arm', array['one arm seated cable row','single arm cable row'], false, 80),
    ('Single-Arm Rotational D-Handle', 'neutral', 'd-handle', 'seated', 'unilateral', 'rotational single arm', array['rotational cable row'], false, 90)
) as variation(name, grip, attachment, stance, laterality, execution_style, aliases, is_default, sort_order)
where lower(exercises.name) = 'seated cable row'
  and exercises.owner_id is null
on conflict (exercise_id, name) do update set
  grip = excluded.grip,
  attachment = excluded.attachment,
  stance = excluded.stance,
  laterality = excluded.laterality,
  execution_style = excluded.execution_style,
  aliases = excluded.aliases,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order;
