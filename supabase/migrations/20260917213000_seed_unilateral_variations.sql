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
    ('Leg Press', 'Bilateral Standard Stance', null, 'leg press platform', 'standard', 'bilateral', 'standard', array['standard leg press'], 10),
    ('Leg Press', 'Single-Leg', null, 'leg press platform', 'standard', 'unilateral', 'single leg', array['one leg press','unilateral leg press'], 20),
    ('Leg Press', 'High Foot Placement', null, 'leg press platform', 'high foot', 'bilateral', 'glute hamstring bias', array['high foot leg press'], 30),
    ('Leg Press', 'Low Foot Placement', null, 'leg press platform', 'low foot', 'bilateral', 'quad bias', array['low foot leg press'], 40),
    ('Leg Extension', 'Bilateral', null, 'leg extension machine', 'seated', 'bilateral', 'standard', array['two leg extension'], 10),
    ('Leg Extension', 'Single-Leg', null, 'leg extension machine', 'seated', 'unilateral', 'single leg', array['one leg extension','unilateral leg extension'], 20),
    ('Lying Leg Curl', 'Bilateral', null, 'lying leg curl machine', 'prone', 'bilateral', 'standard', array['two leg lying curl'], 10),
    ('Lying Leg Curl', 'Single-Leg', null, 'lying leg curl machine', 'prone', 'unilateral', 'single leg', array['one leg lying curl'], 20),
    ('Seated Leg Curl', 'Bilateral', null, 'seated leg curl machine', 'seated', 'bilateral', 'standard', array['two leg seated curl'], 10),
    ('Seated Leg Curl', 'Single-Leg', null, 'seated leg curl machine', 'seated', 'unilateral', 'single leg', array['one leg seated curl'], 20),
    ('Standing Calf Raise', 'Bilateral', null, 'standing calf machine', 'standing', 'bilateral', 'standard', array['two leg standing calf raise'], 10),
    ('Standing Calf Raise', 'Single-Leg', null, 'standing calf machine', 'standing', 'unilateral', 'single leg', array['one leg standing calf raise'], 20),
    ('Seated Calf Raise', 'Bilateral', null, 'seated calf machine', 'seated', 'bilateral', 'standard', array['two leg seated calf raise'], 10),
    ('Seated Calf Raise', 'Single-Leg', null, 'seated calf machine', 'seated', 'unilateral', 'single leg', array['one leg seated calf raise'], 20),
    ('Dumbbell Shoulder Press', 'Bilateral', 'neutral', 'dumbbells', 'seated', 'bilateral', 'standard', array['two arm dumbbell shoulder press'], 10),
    ('Dumbbell Shoulder Press', 'Single-Arm Seated', 'neutral', 'single dumbbell', 'seated', 'unilateral', 'single arm', array['one arm seated dumbbell shoulder press'], 20),
    ('Dumbbell Shoulder Press', 'Single-Arm Standing', 'neutral', 'single dumbbell', 'standing', 'unilateral', 'single arm', array['one arm standing dumbbell press'], 30),
    ('Dumbbell Lateral Raise', 'Bilateral Standing', 'neutral', 'dumbbells', 'standing', 'bilateral', 'standard', array['two arm lateral raise'], 10),
    ('Dumbbell Lateral Raise', 'Single-Arm Standing', 'neutral', 'single dumbbell', 'standing', 'unilateral', 'single arm', array['one arm lateral raise'], 20),
    ('Dumbbell Lateral Raise', 'Single-Arm Lean-Away', 'neutral', 'single dumbbell', 'leaning', 'unilateral', 'lean-away', array['lean away lateral raise'], 30)
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
