insert into public.exercises (
  name,
  muscle_group,
  equipment,
  aliases,
  secondary_muscles,
  movement_pattern,
  is_unilateral
)
values
  (
    'Barbell Bench Press',
    'Chest',
    'Barbell',
    array['Bench Press', 'Flat Bench Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Incline Barbell Bench Press',
    'Chest',
    'Barbell',
    array['Incline Bench Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Decline Barbell Bench Press',
    'Chest',
    'Barbell',
    array['Decline Bench Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Dumbbell Bench Press',
    'Chest',
    'Dumbbell',
    array['Dumbbell Chest Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Incline Dumbbell Bench Press',
    'Chest',
    'Dumbbell',
    array['Incline Dumbbell Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Decline Dumbbell Bench Press',
    'Chest',
    'Dumbbell',
    array['Decline Dumbbell Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Machine Chest Press',
    'Chest',
    'Machine',
    array['Chest Press Machine'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Smith Machine Bench Press',
    'Chest',
    'Smith Machine',
    array['Smith Bench Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Dumbbell Fly',
    'Chest',
    'Dumbbell',
    array['Dumbbell Chest Fly'],
    array['Shoulders'],
    'isolation',
    false
  ),
  (
    'Cable Fly',
    'Chest',
    'Cable',
    array['Cable Crossover'],
    array['Shoulders'],
    'isolation',
    false
  ),
  (
    'Low-to-High Cable Fly',
    'Chest',
    'Cable',
    array['Low Cable Fly'],
    array['Shoulders'],
    'isolation',
    false
  ),
  (
    'High-to-Low Cable Fly',
    'Chest',
    'Cable',
    array['High Cable Fly'],
    array['Shoulders'],
    'isolation',
    false
  ),
  (
    'Pec Deck',
    'Chest',
    'Machine',
    array['Machine Chest Fly'],
    array['Shoulders'],
    'isolation',
    false
  ),
  (
    'Push-Up',
    'Chest',
    'Bodyweight',
    array['Pushup'],
    array['Triceps', 'Shoulders', 'Core'],
    'horizontal_push',
    false
  ),
  (
    'Incline Push-Up',
    'Chest',
    'Bodyweight',
    array['Elevated Push-Up'],
    array['Triceps', 'Shoulders', 'Core'],
    'horizontal_push',
    false
  ),
  (
    'Decline Push-Up',
    'Chest',
    'Bodyweight',
    array['Feet-Elevated Push-Up'],
    array['Triceps', 'Shoulders', 'Core'],
    'horizontal_push',
    false
  ),
  (
    'Chest Dip',
    'Chest',
    'Bodyweight',
    array['Dip'],
    array['Triceps', 'Shoulders'],
    'vertical_push',
    false
  ),
  (
    'Floor Press',
    'Chest',
    'Barbell',
    array['Barbell Floor Press'],
    array['Triceps', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Overhead Press',
    'Shoulders',
    'Barbell',
    array['Military Press', 'Standing Barbell Press'],
    array['Triceps', 'Core'],
    'vertical_push',
    false
  ),
  (
    'Seated Barbell Shoulder Press',
    'Shoulders',
    'Barbell',
    array['Seated Overhead Press'],
    array['Triceps'],
    'vertical_push',
    false
  ),
  (
    'Dumbbell Shoulder Press',
    'Shoulders',
    'Dumbbell',
    array['Dumbbell Overhead Press'],
    array['Triceps'],
    'vertical_push',
    false
  ),
  (
    'Arnold Press',
    'Shoulders',
    'Dumbbell',
    array['Arnold Shoulder Press'],
    array['Triceps'],
    'vertical_push',
    false
  ),
  (
    'Machine Shoulder Press',
    'Shoulders',
    'Machine',
    array['Shoulder Press Machine'],
    array['Triceps'],
    'vertical_push',
    false
  ),
  (
    'Landmine Press',
    'Shoulders',
    'Landmine',
    array['Single-Arm Landmine Press'],
    array['Chest', 'Triceps', 'Core'],
    'vertical_push',
    true
  ),
  (
    'Dumbbell Lateral Raise',
    'Shoulders',
    'Dumbbell',
    array['Lateral Raise', 'Side Raise'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Cable Lateral Raise',
    'Shoulders',
    'Cable',
    array['Single-Arm Cable Lateral Raise'],
    array[]::text[],
    'isolation',
    true
  ),
  (
    'Machine Lateral Raise',
    'Shoulders',
    'Machine',
    array['Lateral Raise Machine'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Dumbbell Front Raise',
    'Shoulders',
    'Dumbbell',
    array['Front Raise'],
    array['Chest'],
    'isolation',
    false
  ),
  (
    'Close-Grip Bench Press',
    'Triceps',
    'Barbell',
    array['Close Grip Bench'],
    array['Chest', 'Shoulders'],
    'horizontal_push',
    false
  ),
  (
    'Triceps Pushdown',
    'Triceps',
    'Cable',
    array['Cable Pushdown', 'Pressdown'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Rope Triceps Pushdown',
    'Triceps',
    'Cable',
    array['Rope Pressdown'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Overhead Cable Triceps Extension',
    'Triceps',
    'Cable',
    array['Cable Overhead Extension'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Dumbbell Overhead Triceps Extension',
    'Triceps',
    'Dumbbell',
    array['Overhead Dumbbell Extension'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'EZ-Bar Skull Crusher',
    'Triceps',
    'EZ Bar',
    array['Skull Crusher', 'Lying Triceps Extension'],
    array[]::text[],
    'isolation',
    false
  ),
  (
    'Triceps Dip',
    'Triceps',
    'Bodyweight',
    array['Bench Dip'],
    array['Chest', 'Shoulders'],
    'vertical_push',
    false
  )
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
