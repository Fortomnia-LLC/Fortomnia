insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, is_unilateral
)
values
  ('Hand Gripper Close', 'Grip', 'Hand Gripper', array['Gripper Close','Crush Gripper'], array['Forearms'], 'grip_crush', true),
  ('Hand Gripper Hold', 'Grip', 'Hand Gripper', array['Gripper Hold'], array['Forearms'], 'grip_crush', true),
  ('Hand Gripper Negative', 'Grip', 'Hand Gripper', array['Gripper Negative'], array['Forearms'], 'grip_crush', true),
  ('Plate Pinch Hold', 'Grip', 'Weight Plate', array['Plate Pinch'], array['Forearms','Thumbs'], 'grip_pinch', true),
  ('Plate Pinch Carry', 'Grip', 'Weight Plate', array['Plate Pinch Walk'], array['Forearms','Thumbs','Core'], 'grip_pinch', true),
  ('Block Weight Pinch', 'Grip', 'Block Weight', array['Block Weight Lift'], array['Forearms','Thumbs'], 'grip_pinch', true),
  ('Hub Lift', 'Grip', 'Hub', array['Plate Hub Lift'], array['Forearms','Thumbs'], 'grip_pinch', true),
  ('Rolling Handle Lift', 'Grip', 'Rolling Handle', array['Rolling Thunder Lift','Rolling Grip Lift'], array['Forearms','Biceps'], 'grip_support', true),
  ('Vertical Bar Lift', 'Grip', 'Vertical Bar', array['V-Bar Grip Lift'], array['Forearms'], 'grip_support', true),
  ('Barbell Static Hold', 'Grip', 'Barbell', array['Barbell Hold'], array['Forearms','Traps'], 'grip_support', false),
  ('Axle Bar Static Hold', 'Grip', 'Axle Bar', array['Axle Hold','Fat Bar Hold'], array['Forearms','Traps'], 'grip_support', false),
  ('Dead Hang', 'Grip', 'Pull-Up Bar', array['Passive Hang','Bar Hang'], array['Forearms','Back','Shoulders'], 'grip_support', false),
  ('Single-Arm Dead Hang', 'Grip', 'Pull-Up Bar', array['One-Arm Dead Hang','One Arm Hang'], array['Forearms','Back','Shoulders','Core'], 'grip_support', true),
  ('Towel Hang', 'Grip', 'Towel', array['Towel Dead Hang'], array['Forearms','Back','Biceps'], 'grip_support', false),
  ('Towel Pull-Up', 'Back', 'Towel', array['Towel Grip Pull-Up'], array['Grip','Forearms','Biceps'], 'vertical_pull', false),
  ('Wrist Roller', 'Forearms', 'Wrist Roller', array['Wrist Roll'], array['Grip'], 'wrist_flexion_extension', false),
  ('Barbell Wrist Curl', 'Forearms', 'Barbell', array['Barbell Forearm Curl'], array['Grip'], 'wrist_flexion', false),
  ('Barbell Reverse Wrist Curl', 'Forearms', 'Barbell', array['Barbell Wrist Extension'], array['Grip'], 'wrist_extension', false),
  ('Behind-the-Back Wrist Curl', 'Forearms', 'Barbell', array['Behind Back Wrist Curl'], array['Grip'], 'wrist_flexion', false),
  ('Finger Curl', 'Grip', 'Barbell', array['Barbell Finger Curl'], array['Forearms'], 'finger_flexion', false),
  ('Dumbbell Pronation', 'Forearms', 'Dumbbell', array['Forearm Pronation'], array['Grip'], 'forearm_rotation', true),
  ('Dumbbell Supination', 'Forearms', 'Dumbbell', array['Forearm Supination'], array['Grip'], 'forearm_rotation', true),
  ('Lever Wrist Curl', 'Forearms', 'Lever Bar', array['Wrist Lever'], array['Grip'], 'wrist_flexion_extension', true),
  ('Sledgehammer Lever', 'Forearms', 'Sledgehammer', array['Hammer Lever'], array['Grip'], 'forearm_rotation', true),
  ('Finger Extension Band', 'Grip', 'Finger Band', array['Rubber Band Finger Extension'], array['Forearms'], 'finger_extension', false),
  ('Rice Bucket Grip Drill', 'Grip', 'Rice Bucket', array['Rice Bucket Hand Exercise'], array['Forearms','Fingers'], 'grip_conditioning', false),
  ('Rope Climb', 'Grip', 'Rope', array['Climbing Rope'], array['Back','Biceps','Forearms','Core'], 'vertical_pull', false),
  ('Rope Hold', 'Grip', 'Rope', array['Static Rope Hold'], array['Forearms','Back','Biceps'], 'grip_support', false)
on conflict (lower(name))
where owner_id is null
do update set
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  aliases = excluded.aliases,
  secondary_muscles = excluded.secondary_muscles,
  movement_pattern = excluded.movement_pattern,
  is_unilateral = excluded.is_unilateral;
