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
    ('T-Bar Row', 'Close Neutral V-Handle', 'neutral', 'v-handle', 'hinged', 'bilateral', 'landmine row', array['close grip t bar row'], 10),
    ('T-Bar Row', 'Wide Overhand Handle', 'overhand', 'wide row handle', 'hinged', 'bilateral', 'landmine row', array['wide grip t bar row'], 20),
    ('T-Bar Row', 'Medium Neutral Handle', 'neutral', 'medium neutral handle', 'hinged', 'bilateral', 'landmine row', array['neutral grip t bar row'], 30),
    ('T-Bar Row', 'Chest-Supported Close Neutral', 'neutral', 'v-handle', 'chest-supported', 'bilateral', 'machine supported', array['chest supported t bar row'], 40),
    ('Machine Row', 'Bilateral Neutral', 'neutral', 'machine handles', 'seated', 'bilateral', 'standard', array['neutral grip machine row'], 10),
    ('Machine Row', 'Bilateral Overhand', 'overhand', 'machine handles', 'seated', 'bilateral', 'standard', array['overhand machine row'], 20),
    ('Machine Row', 'Single-Arm Neutral', 'neutral', 'machine handle', 'seated', 'unilateral', 'single arm', array['one arm machine row'], 30),
    ('Machine Row', 'Single-Arm Pronated', 'overhand', 'machine handle', 'seated', 'unilateral', 'single arm', array['single arm overhand machine row'], 40),
    ('Straight-Arm Pulldown', 'Straight Bar', 'overhand', 'straight bar', 'standing', 'bilateral', 'straight arm', array['straight bar straight arm pulldown'], 10),
    ('Straight-Arm Pulldown', 'Rope', 'neutral', 'rope', 'standing', 'bilateral', 'straight arm', array['rope straight arm pulldown'], 20),
    ('Straight-Arm Pulldown', 'Dual D-Handles', 'neutral', 'dual d-handles', 'standing', 'bilateral', 'independent arms', array['dual handle straight arm pulldown'], 30),
    ('Straight-Arm Pulldown', 'Single D-Handle', 'neutral', 'single d-handle', 'standing', 'unilateral', 'single arm', array['one arm straight arm pulldown'], 40),
    ('Cable Pullover', 'Rope', 'neutral', 'rope', 'standing', 'bilateral', 'standard', array['rope cable pullover'], 10),
    ('Cable Pullover', 'Straight Bar', 'overhand', 'straight bar', 'standing', 'bilateral', 'standard', array['straight bar cable pullover'], 20),
    ('Cable Pullover', 'Single D-Handle', 'neutral', 'single d-handle', 'standing', 'unilateral', 'single arm', array['one arm cable pullover'], 30)
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
