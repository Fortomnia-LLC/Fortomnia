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
  ('Crunch', 'Core', 'Bodyweight', array['Abdominal Crunch'], array[]::text[], 'isolation', false),
  ('Cable Crunch', 'Core', 'Cable', array['Kneeling Cable Crunch'], array[]::text[], 'isolation', false),
  ('Reverse Crunch', 'Core', 'Bodyweight', array['Lying Reverse Crunch'], array['Hip Flexors'], 'isolation', false),
  ('Sit-Up', 'Core', 'Bodyweight', array['Situp'], array['Hip Flexors'], 'isolation', false),
  ('Decline Sit-Up', 'Core', 'Bodyweight', array['Decline Bench Sit-Up'], array['Hip Flexors'], 'isolation', false),
  ('Hanging Knee Raise', 'Core', 'Bodyweight', array['Hanging Knee Tuck'], array['Hip Flexors', 'Grip'], 'isolation', false),
  ('Hanging Leg Raise', 'Core', 'Bodyweight', array['Straight-Leg Raise'], array['Hip Flexors', 'Grip'], 'isolation', false),
  ('Captains Chair Knee Raise', 'Core', 'Bodyweight', array['Vertical Knee Raise'], array['Hip Flexors'], 'isolation', false),
  ('Ab Wheel Rollout', 'Core', 'Ab Wheel', array['Ab Rollout'], array['Shoulders', 'Lats'], 'isolation', false),
  ('Bicycle Crunch', 'Core', 'Bodyweight', array['Bicycle Kick'], array['Obliques', 'Hip Flexors'], 'rotation', false),
  ('V-Up', 'Core', 'Bodyweight', array['V Sit-Up'], array['Hip Flexors'], 'isolation', false),
  ('Toe Touch', 'Core', 'Bodyweight', array['Lying Toe Touch'], array[]::text[], 'isolation', false),
  ('Heel Touch', 'Obliques', 'Bodyweight', array['Alternating Heel Touch'], array['Core'], 'rotation', false),
  ('Russian Twist', 'Obliques', 'Bodyweight', array['Seated Twist'], array['Core', 'Hip Flexors'], 'rotation', false),
  ('Cable Wood Chop', 'Obliques', 'Cable', array['Cable Chop'], array['Core', 'Shoulders'], 'rotation', true),
  ('Pallof Press', 'Core', 'Cable', array['Anti-Rotation Press'], array['Obliques', 'Shoulders'], 'rotation', true),
  ('Landmine Rotation', 'Obliques', 'Landmine', array['Landmine Twist'], array['Core', 'Shoulders'], 'rotation', false),
  ('Dead Bug', 'Core', 'Bodyweight', array['Deadbug'], array['Hip Flexors'], 'isolation', true),
  ('Bird Dog', 'Core', 'Bodyweight', array['Quadruped Bird Dog'], array['Glutes', 'Back', 'Shoulders'], 'isolation', true),
  ('Mountain Climber', 'Core', 'Bodyweight', array['Mountain Climbers'], array['Shoulders', 'Hip Flexors'], 'conditioning', true),
  ('Medicine Ball Slam', 'Full Body', 'Medicine Ball', array['Med Ball Slam'], array['Core', 'Shoulders', 'Back'], 'conditioning', false),
  ('Kettlebell Swing', 'Posterior Chain', 'Kettlebell', array['KB Swing'], array['Glutes', 'Hamstrings', 'Core'], 'hinge', false),
  ('Turkish Get-Up', 'Full Body', 'Kettlebell', array['Turkish Getup', 'TGU'], array['Shoulders', 'Core', 'Glutes'], 'other', true),
  ('Suitcase Carry', 'Core', 'Dumbbell', array['Suitcase Walk'], array['Grip', 'Obliques', 'Traps'], 'carry', true),
  ('Overhead Carry', 'Shoulders', 'Dumbbell', array['Waiter Carry', 'Waiter Walk'], array['Core', 'Triceps', 'Grip'], 'carry', true),
  ('Sled Push', 'Full Body', 'Sled', array['Prowler Push'], array['Quadriceps', 'Glutes', 'Calves'], 'conditioning', false)
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
