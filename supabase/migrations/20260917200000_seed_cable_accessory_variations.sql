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
    ('Triceps Pushdown', 'Straight Bar Overhand', 'overhand', 'straight bar', 'standing', 'bilateral', 'standard', array['straight bar pressdown'], 10),
    ('Triceps Pushdown', 'V-Bar', 'neutral', 'v-bar', 'standing', 'bilateral', 'standard', array['v bar pressdown'], 20),
    ('Triceps Pushdown', 'Rope', 'neutral', 'rope', 'standing', 'bilateral', 'standard', array['rope pressdown'], 30),
    ('Triceps Pushdown', 'EZ-Bar Attachment', 'overhand', 'ez-bar attachment', 'standing', 'bilateral', 'standard', array['ez bar cable pressdown'], 40),
    ('Triceps Pushdown', 'Single D-Handle', 'neutral', 'single d-handle', 'standing', 'unilateral', 'single arm', array['one arm cable pressdown'], 50),
    ('Triceps Pushdown', 'Underhand Straight Bar', 'underhand', 'straight bar', 'standing', 'bilateral', 'reverse grip', array['reverse grip pressdown'], 60),
    ('Overhead Cable Triceps Extension', 'Rope', 'neutral', 'rope', 'standing', 'bilateral', 'overhead', array['rope overhead triceps extension'], 10),
    ('Overhead Cable Triceps Extension', 'Straight Bar', 'overhand', 'straight bar', 'standing', 'bilateral', 'overhead', array['straight bar overhead cable extension'], 20),
    ('Overhead Cable Triceps Extension', 'EZ-Bar Attachment', 'overhand', 'ez-bar attachment', 'standing', 'bilateral', 'overhead', array['ez bar overhead cable extension'], 30),
    ('Overhead Cable Triceps Extension', 'Single D-Handle', 'neutral', 'single d-handle', 'standing', 'unilateral', 'single arm overhead', array['one arm overhead cable extension'], 40),
    ('Face Pull', 'Rope', 'neutral', 'rope', 'standing', 'bilateral', 'standard', array['rope face pull'], 10),
    ('Face Pull', 'Dual D-Handles', 'neutral', 'dual d-handles', 'standing', 'bilateral', 'independent handles', array['dual handle face pull'], 20),
    ('Cable Curl', 'Straight Bar', 'underhand', 'straight bar', 'standing', 'bilateral', 'standard', array['straight bar cable curl'], 10),
    ('Cable Curl', 'EZ-Bar Attachment', 'underhand', 'ez-bar attachment', 'standing', 'bilateral', 'standard', array['ez bar cable curl'], 20),
    ('Cable Curl', 'Rope Hammer Grip', 'neutral', 'rope', 'standing', 'bilateral', 'hammer grip', array['rope cable curl','rope hammer curl'], 30),
    ('Cable Curl', 'Single D-Handle', 'underhand', 'single d-handle', 'standing', 'unilateral', 'single arm', array['one arm cable curl'], 40)
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
