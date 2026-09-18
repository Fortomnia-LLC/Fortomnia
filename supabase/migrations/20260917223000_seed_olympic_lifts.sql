insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, is_unilateral
)
values
  ('Snatch', 'Full Body', 'Barbell', array['Squat Snatch','Olympic Snatch'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Power Snatch', 'Full Body', 'Barbell', array['Power Position Snatch'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Hang Snatch', 'Full Body', 'Barbell', array['Hang Squat Snatch'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Hang Power Snatch', 'Full Body', 'Barbell', array['Power Snatch From Hang'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Block Snatch', 'Full Body', 'Barbell', array['Snatch From Blocks'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Snatch Pull', 'Full Body', 'Barbell', array['Olympic Snatch Pull'], array['Back','Glutes','Hamstrings','Quadriceps','Traps'], 'olympic_lift', false),
  ('Snatch High Pull', 'Full Body', 'Barbell', array['Snatch-Grip High Pull'], array['Back','Glutes','Hamstrings','Quadriceps','Traps'], 'olympic_lift', false),
  ('Snatch Balance', 'Full Body', 'Barbell', array['Drop Snatch Balance'], array['Shoulders','Quadriceps','Glutes','Core'], 'olympic_lift', false),
  ('Drop Snatch', 'Full Body', 'Barbell', array['Snatch Drop'], array['Shoulders','Quadriceps','Glutes','Core'], 'olympic_lift', false),
  ('Muscle Snatch', 'Full Body', 'Barbell', array['Tall Muscle Snatch'], array['Shoulders','Back','Traps','Core'], 'olympic_lift', false),
  ('Clean', 'Full Body', 'Barbell', array['Squat Clean','Olympic Clean'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Power Clean', 'Full Body', 'Barbell', array['Power Position Clean'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Hang Clean', 'Full Body', 'Barbell', array['Hang Squat Clean'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Hang Power Clean', 'Full Body', 'Barbell', array['Power Clean From Hang'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Block Clean', 'Full Body', 'Barbell', array['Clean From Blocks'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', false),
  ('Clean Pull', 'Full Body', 'Barbell', array['Olympic Clean Pull'], array['Back','Glutes','Hamstrings','Quadriceps','Traps'], 'olympic_lift', false),
  ('Clean High Pull', 'Full Body', 'Barbell', array['Clean-Grip High Pull'], array['Back','Glutes','Hamstrings','Quadriceps','Traps'], 'olympic_lift', false),
  ('Muscle Clean', 'Full Body', 'Barbell', array['Tall Muscle Clean'], array['Shoulders','Back','Traps','Core'], 'olympic_lift', false),
  ('Clean and Jerk', 'Full Body', 'Barbell', array['Clean & Jerk','C&J'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Triceps','Core'], 'olympic_lift', false),
  ('Jerk', 'Full Body', 'Barbell', array['Split Jerk'], array['Shoulders','Quadriceps','Glutes','Triceps','Core'], 'olympic_lift', false),
  ('Power Jerk', 'Full Body', 'Barbell', array['Push Jerk'], array['Shoulders','Quadriceps','Glutes','Triceps','Core'], 'olympic_lift', false),
  ('Squat Jerk', 'Full Body', 'Barbell', array['Deep Squat Jerk'], array['Shoulders','Quadriceps','Glutes','Triceps','Core'], 'olympic_lift', false),
  ('Jerk From Blocks', 'Full Body', 'Barbell', array['Block Jerk'], array['Shoulders','Quadriceps','Glutes','Triceps','Core'], 'olympic_lift', false),
  ('Clean and Press', 'Full Body', 'Barbell', array['Clean & Press'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Triceps','Core'], 'olympic_lift', false),
  ('Dumbbell Snatch', 'Full Body', 'Dumbbell', array['Single-Arm Dumbbell Snatch'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', true),
  ('Dumbbell Clean', 'Full Body', 'Dumbbell', array['Single-Arm Dumbbell Clean'], array['Back','Glutes','Hamstrings','Quadriceps','Core'], 'olympic_lift', true),
  ('Dumbbell Clean and Jerk', 'Full Body', 'Dumbbell', array['Single-Arm Dumbbell Clean and Jerk'], array['Shoulders','Back','Glutes','Hamstrings','Quadriceps','Triceps','Core'], 'olympic_lift', true),
  ('Kettlebell Snatch', 'Full Body', 'Kettlebell', array['Single-Arm Kettlebell Snatch'], array['Shoulders','Back','Glutes','Hamstrings','Core'], 'olympic_lift', true),
  ('Kettlebell Clean', 'Full Body', 'Kettlebell', array['Single-Arm Kettlebell Clean'], array['Back','Glutes','Hamstrings','Core'], 'olympic_lift', true),
  ('Kettlebell Clean and Jerk', 'Full Body', 'Kettlebell', array['Kettlebell Long Cycle','Single-Arm Kettlebell Clean and Jerk'], array['Shoulders','Back','Glutes','Hamstrings','Triceps','Core'], 'olympic_lift', true)
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
