insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, is_unilateral
)
values
  ('Box Jump', 'Full Body', 'Plyo Box', array['Plyometric Box Jump'], array['Quadriceps','Glutes','Calves','Core'], 'plyometric', false),
  ('Seated Box Jump', 'Full Body', 'Plyo Box', array['Seated Jump to Box'], array['Quadriceps','Glutes','Calves','Core'], 'plyometric', false),
  ('Depth Jump', 'Full Body', 'Plyo Box', array['Drop Jump to Vertical Jump'], array['Quadriceps','Glutes','Calves'], 'plyometric', false),
  ('Drop Jump', 'Full Body', 'Plyo Box', array['Depth Drop Rebound'], array['Quadriceps','Glutes','Calves'], 'plyometric', false),
  ('Broad Jump', 'Full Body', 'Bodyweight', array['Standing Long Jump'], array['Quadriceps','Glutes','Hamstrings','Calves'], 'plyometric', false),
  ('Repeated Broad Jump', 'Full Body', 'Bodyweight', array['Continuous Broad Jumps'], array['Quadriceps','Glutes','Hamstrings','Calves'], 'plyometric', false),
  ('Vertical Jump', 'Full Body', 'Bodyweight', array['Countermovement Jump'], array['Quadriceps','Glutes','Calves'], 'plyometric', false),
  ('Squat Jump', 'Full Body', 'Bodyweight', array['Jump Squat'], array['Quadriceps','Glutes','Calves'], 'plyometric', false),
  ('Tuck Jump', 'Full Body', 'Bodyweight', array['Knee Tuck Jump'], array['Quadriceps','Glutes','Calves','Core'], 'plyometric', false),
  ('Pogo Jump', 'Calves', 'Bodyweight', array['Pogo Hop','Ankle Hop'], array['Quadriceps','Hamstrings'], 'plyometric', false),
  ('Single-Leg Pogo Jump', 'Calves', 'Bodyweight', array['Single Leg Pogo Hop'], array['Quadriceps','Hamstrings'], 'plyometric', true),
  ('Lateral Bound', 'Full Body', 'Bodyweight', array['Skater Bound'], array['Glutes','Quadriceps','Hamstrings','Calves'], 'plyometric', true),
  ('Single-Leg Broad Jump', 'Full Body', 'Bodyweight', array['Single Leg Horizontal Jump'], array['Glutes','Quadriceps','Hamstrings','Calves'], 'plyometric', true),
  ('Single-Leg Box Jump', 'Full Body', 'Plyo Box', array['One Leg Box Jump'], array['Glutes','Quadriceps','Calves'], 'plyometric', true),
  ('Split Squat Jump', 'Full Body', 'Bodyweight', array['Jumping Split Squat','Lunge Jump'], array['Quadriceps','Glutes','Hamstrings','Calves'], 'plyometric', true),
  ('Hurdle Hop', 'Full Body', 'Hurdle', array['Hurdle Jump'], array['Quadriceps','Glutes','Calves'], 'plyometric', false),
  ('Lateral Hurdle Hop', 'Full Body', 'Hurdle', array['Side to Side Hurdle Hop'], array['Glutes','Quadriceps','Calves'], 'plyometric', false),
  ('Single-Leg Hurdle Hop', 'Full Body', 'Hurdle', array['One Leg Hurdle Hop'], array['Glutes','Quadriceps','Calves'], 'plyometric', true),
  ('Bounding', 'Full Body', 'Bodyweight', array['Running Bounds'], array['Glutes','Hamstrings','Quadriceps','Calves'], 'plyometric', true),
  ('Power Skip', 'Full Body', 'Bodyweight', array['A-Skip for Height','Explosive Skip'], array['Glutes','Hamstrings','Quadriceps','Calves'], 'plyometric', true),
  ('Medicine Ball Chest Pass', 'Full Body', 'Medicine Ball', array['Med Ball Chest Throw'], array['Chest','Triceps','Shoulders','Core'], 'ballistic_throw', false),
  ('Medicine Ball Overhead Throw', 'Full Body', 'Medicine Ball', array['Med Ball Overhead Throw'], array['Shoulders','Back','Core','Glutes'], 'ballistic_throw', false),
  ('Medicine Ball Rotational Throw', 'Full Body', 'Medicine Ball', array['Rotational Med Ball Throw','Side Toss'], array['Obliques','Core','Glutes','Shoulders'], 'ballistic_throw', true),
  ('Medicine Ball Scoop Toss', 'Full Body', 'Medicine Ball', array['Med Ball Scoop Throw'], array['Glutes','Core','Shoulders','Back'], 'ballistic_throw', true),
  ('Medicine Ball Shot Put Throw', 'Full Body', 'Medicine Ball', array['Med Ball Shot Put'], array['Chest','Shoulders','Triceps','Core'], 'ballistic_throw', true),
  ('Plyometric Push-Up', 'Chest', 'Bodyweight', array['Explosive Push-Up'], array['Triceps','Shoulders','Core'], 'plyometric', false),
  ('Clap Push-Up', 'Chest', 'Bodyweight', array['Clapping Push-Up'], array['Triceps','Shoulders','Core'], 'plyometric', false),
  ('Depth Push-Up', 'Chest', 'Plyo Box', array['Drop Push-Up'], array['Triceps','Shoulders','Core'], 'plyometric', false),
  ('Explosive Step-Up', 'Full Body', 'Plyo Box', array['Plyometric Step-Up'], array['Quadriceps','Glutes','Calves'], 'plyometric', true),
  ('Lateral Box Jump', 'Full Body', 'Plyo Box', array['Side Box Jump'], array['Glutes','Quadriceps','Calves'], 'plyometric', false)
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
