insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, is_unilateral
)
values
  ('Atlas Stone Load', 'Full Body', 'Atlas Stone', array['Atlas Stone','Stone Load'], array['Back','Glutes','Hamstrings','Quadriceps','Biceps','Grip','Core'], 'strongman_load', false),
  ('Stone to Shoulder', 'Full Body', 'Atlas Stone', array['Atlas Stone to Shoulder'], array['Back','Glutes','Hamstrings','Biceps','Grip','Core'], 'strongman_load', false),
  ('Yoke Carry', 'Full Body', 'Yoke', array['Yoke Walk'], array['Quadriceps','Glutes','Traps','Core','Calves'], 'carry', false),
  ('Frame Carry', 'Full Body', 'Frame', array['Frame Walk'], array['Grip','Traps','Core','Glutes','Quadriceps'], 'carry', false),
  ('Husafell Carry', 'Full Body', 'Husafell Stone', array['Husafell Stone Carry','Shield Carry'], array['Biceps','Back','Core','Glutes','Grip'], 'carry', false),
  ('Conan Wheel', 'Full Body', 'Conan Wheel', array['Conans Wheel','Conan Carry'], array['Biceps','Back','Core','Glutes','Quadriceps'], 'carry', false),
  ('Duck Walk', 'Full Body', 'Duck Walk Implement', array['Strongman Duck Walk'], array['Grip','Back','Glutes','Quadriceps','Core'], 'carry', false),
  ('Sandbag Carry', 'Full Body', 'Sandbag', array['Bear Hug Sandbag Carry'], array['Back','Biceps','Core','Glutes','Grip'], 'carry', false),
  ('Sandbag Load', 'Full Body', 'Sandbag', array['Sandbag Loading'], array['Back','Glutes','Hamstrings','Biceps','Core'], 'strongman_load', false),
  ('Sandbag to Shoulder', 'Full Body', 'Sandbag', array['Sandbag Shoulder'], array['Back','Glutes','Hamstrings','Biceps','Core'], 'strongman_load', false),
  ('Keg Carry', 'Full Body', 'Keg', array['Strongman Keg Carry'], array['Back','Biceps','Core','Glutes','Grip'], 'carry', false),
  ('Keg Load', 'Full Body', 'Keg', array['Keg Loading'], array['Back','Glutes','Hamstrings','Biceps','Core'], 'strongman_load', false),
  ('Keg Toss', 'Full Body', 'Keg', array['Keg Throw'], array['Glutes','Hamstrings','Back','Shoulders','Core'], 'strongman_throw', false),
  ('Tire Flip', 'Full Body', 'Tire', array['Strongman Tire Flip'], array['Back','Glutes','Hamstrings','Quadriceps','Chest','Biceps'], 'strongman_load', false),
  ('Sled Drag', 'Full Body', 'Sled', array['Backward Sled Drag','Strongman Sled Drag'], array['Quadriceps','Glutes','Calves','Core'], 'conditioning', false),
  ('Arm-Over-Arm Pull', 'Full Body', 'Rope and Sled', array['Rope Sled Pull','Truck Pull Arm Over Arm'], array['Back','Biceps','Grip','Core'], 'horizontal_pull', false),
  ('Harness Vehicle Pull', 'Full Body', 'Harness', array['Truck Pull','Vehicle Pull'], array['Quadriceps','Glutes','Calves','Back','Core'], 'conditioning', false),
  ('Log Clean and Press', 'Full Body', 'Strongman Log', array['Log Clean & Press','Log Press'], array['Shoulders','Triceps','Back','Glutes','Quadriceps','Core'], 'strongman_press', false),
  ('Axle Clean and Press', 'Full Body', 'Axle Bar', array['Axle Clean & Press','Axle Press'], array['Shoulders','Triceps','Back','Glutes','Quadriceps','Grip'], 'strongman_press', false),
  ('Circus Dumbbell Press', 'Full Body', 'Circus Dumbbell', array['Circus Dumbbell','CDB Press'], array['Shoulders','Triceps','Core','Glutes','Quadriceps'], 'strongman_press', true),
  ('Viking Press', 'Shoulders', 'Viking Press', array['Strongman Viking Press'], array['Triceps','Quadriceps','Glutes','Core'], 'strongman_press', false),
  ('Car Deadlift', 'Full Body', 'Car Deadlift Frame', array['Vehicle Deadlift'], array['Back','Glutes','Hamstrings','Quadriceps','Grip'], 'hinge', false),
  ('Silver Dollar Deadlift', 'Full Body', 'Silver Dollar Setup', array['18 Inch Deadlift','Elevated Strongman Deadlift'], array['Back','Glutes','Hamstrings','Quadriceps','Grip'], 'hinge', false),
  ('Power Stairs', 'Full Body', 'Power Stairs Implement', array['Strongman Power Stairs'], array['Quadriceps','Glutes','Back','Grip','Core'], 'strongman_load', false),
  ('Fingal Fingers', 'Full Body', 'Fingal Finger', array['Fingals Fingers'], array['Shoulders','Triceps','Back','Glutes','Quadriceps','Core'], 'strongman_load', false),
  ('Strongman Medley', 'Full Body', 'Strongman Implements', array['Event Medley','Loading Medley'], array['Grip','Back','Glutes','Quadriceps','Core'], 'conditioning', false)
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
