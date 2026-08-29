-- First specialty exercise seed. These are training movements, not competition results.
with specialty_exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral
) as (
  values
    ('Hercules Hold', 'Grip', 'Hercules Hold Handles', array['hercules hold'], array['Forearms','Upper Back','Core'], 'isometric_hold', 'Stand tall with the arms extended and hold both handles without bracing them against the body.', false),
    ('Farmer Handle Hold', 'Grip', 'Farmer Handles', array['farmers hold','farmer hold'], array['Forearms','Traps','Core'], 'isometric_hold', 'Stand tall with a heavy handle in each hand and maintain a secure support grip for the prescribed time.', false),
    ('Heavy Dumbbell Hold', 'Grip', 'Dumbbell', array['dumbbell hold'], array['Forearms','Traps'], 'isometric_hold', 'Hold heavy dumbbells at the sides with a tall posture for the prescribed duration.', false),
    ('2-inch Pinch Block Lift', 'Grip', 'Pinch Block', array['pinch block lift','2 inch pinch'], array['Forearms'], 'grip_lift', 'Pinch the implement securely and lift under control without supporting it against the body.', true),
    ('Pinch Block Hold', 'Grip', 'Pinch Block', array['pinch hold'], array['Forearms'], 'isometric_hold', 'Maintain thumb-to-finger pressure on the pinch block for the prescribed duration.', true),
    ('2-inch Thumb Blaster Lift', 'Grip', '2-inch Thumb Blaster', array['thumb blaster'], array['Forearms'], 'grip_lift', 'Use the competition-style thumb implement and complete a controlled lift to the required height.', true),
    ('Thick Handle Hammer Lift', 'Grip', 'Thick Handled Heavy Hammer', array['heavy hammer lift','thick hammer'], array['Forearms'], 'grip_lift', 'Control the thick handle and wrist position while lifting the hammer through the prescribed range.', true),
    ('Thick Handle Hammer Hold', 'Grip', 'Thick Handled Heavy Hammer', array['heavy hammer hold'], array['Forearms'], 'isometric_hold', 'Hold the thick-handled hammer securely while maintaining the prescribed wrist position.', true),
    ('Strongman Log Clean and Press', 'Shoulders', 'Strongman Log', array['log press','log clean and press'], array['Triceps','Upper Back','Core'], 'vertical_push', 'Clean the log to the rack position and press overhead to a stable lockout.', false),
    ('Strongman Log Press from Rack', 'Shoulders', 'Strongman Log', array['rack log press'], array['Triceps','Upper Back'], 'vertical_push', 'Start with the log supported at rack height and press to a controlled overhead lockout.', false),
    ('Sandbag to Shoulder', 'Full Body', 'Strongman Sandbag', array['sandbag shoulder'], array['Back','Glutes','Hamstrings','Biceps','Core'], 'load', 'Lift the sandbag from the floor and establish control on one shoulder before lowering.', true),
    ('Sandbag Bear-Hug Carry', 'Full Body', 'Strongman Sandbag', array['sandbag carry'], array['Back','Biceps','Core','Legs'], 'carry', 'Secure the sandbag against the torso and walk with controlled, efficient steps.', false),
    ('Conan Carry', 'Full Body', 'Conan''s Wheel', array['conans wheel','conan wheel'], array['Biceps','Core','Legs','Upper Back'], 'carry', 'Support the implement in the elbows or forearms and carry it around the course without using the belt as a shelf.', false),
    ('Zercher Carry', 'Full Body', 'Barbell', array['barbell zercher carry'], array['Biceps','Core','Legs','Upper Back'], 'carry', 'Carry the bar in the crooks of the elbows while maintaining a braced upright torso.', false),
    ('Front-Loaded Sandbag Carry', 'Full Body', 'Strongman Sandbag', array['front sandbag carry'], array['Biceps','Core','Legs','Upper Back'], 'carry', 'Carry the sandbag high against the torso to develop front-loaded carry capacity.', false),
    ('Strongman Deadlift', 'Posterior Chain', 'Barbell', array['strongman deadlift'], array['Back','Glutes','Hamstrings','Grip'], 'hinge', 'Train a competition-legal deadlift pattern with the stance and equipment appropriate to the target event.', false)
)
insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral, owner_id
)
select
  v.name, v.muscle_group, v.equipment, v.aliases, v.secondary_muscles,
  v.movement_pattern, v.instructions, v.is_unilateral, null
from specialty_exercises v
where not exists (
  select 1 from public.exercises e
  where e.owner_id is null and lower(e.name) = lower(v.name)
);

-- Map exercises to the physical qualities they train.
with mappings(exercise_name, quality_slug, emphasis) as (
  values
    ('Hercules Hold','support_grip','primary'), ('Hercules Hold','grip_endurance','primary'),
    ('Farmer Handle Hold','support_grip','primary'), ('Farmer Handle Hold','grip_endurance','primary'),
    ('Heavy Dumbbell Hold','support_grip','primary'), ('Heavy Dumbbell Hold','grip_endurance','secondary'),
    ('2-inch Pinch Block Lift','pinch_strength','primary'), ('2-inch Pinch Block Lift','thumb_strength','primary'), ('2-inch Pinch Block Lift','wrist_strength','secondary'),
    ('Pinch Block Hold','pinch_strength','primary'), ('Pinch Block Hold','thumb_strength','primary'), ('Pinch Block Hold','grip_endurance','secondary'),
    ('2-inch Thumb Blaster Lift','thumb_strength','primary'), ('2-inch Thumb Blaster Lift','pinch_strength','primary'),
    ('Thick Handle Hammer Lift','thick_bar_strength','primary'), ('Thick Handle Hammer Lift','wrist_strength','primary'),
    ('Thick Handle Hammer Hold','thick_bar_strength','primary'), ('Thick Handle Hammer Hold','wrist_strength','primary'), ('Thick Handle Hammer Hold','grip_endurance','secondary'),
    ('Strongman Log Clean and Press','overhead_strength','primary'), ('Strongman Log Clean and Press','max_strength','secondary'),
    ('Strongman Log Press from Rack','overhead_strength','primary'),
    ('Sandbag to Shoulder','loaded_carry_capacity','secondary'), ('Sandbag to Shoulder','event_speed','secondary'),
    ('Sandbag Bear-Hug Carry','loaded_carry_capacity','primary'),
    ('Conan Carry','loaded_carry_capacity','primary'), ('Conan Carry','grip_endurance','secondary'),
    ('Zercher Carry','loaded_carry_capacity','primary'),
    ('Front-Loaded Sandbag Carry','loaded_carry_capacity','primary'),
    ('Strongman Deadlift','max_strength','primary'), ('Strongman Deadlift','support_grip','secondary')
)
insert into public.exercise_performance_qualities (exercise_id, quality_id, emphasis)
select e.id, q.id, m.emphasis
from mappings m
join public.exercises e on e.owner_id is null and lower(e.name) = lower(m.exercise_name)
join public.performance_qualities q on q.slug = m.quality_slug
on conflict (exercise_id, quality_id) do update set emphasis = excluded.emphasis;

-- Map exercises to exact implements and useful substitutes. Specificity is coaching/event-transfer value, not a claim of equivalence.
with mappings(exercise_name, implement_slug, relationship, specificity, notes) as (
  values
    ('Hercules Hold','hercules_hold_handles','required',100,'Direct strongman event practice.'),
    ('Hercules Hold','nightmare_hercules_2in','substitute',90,'Grip-sport variant with a specialized thick handle.'),
    ('Farmer Handle Hold','farmer_handles','required',85,'Highly useful heavy support-grip substitute for Hercules-style holds.'),
    ('Heavy Dumbbell Hold','farmer_handles','substitute',55,'General support-grip fallback when specialty handles are unavailable.'),
    ('2-inch Pinch Block Lift','pinch_block','required',80,'Pinch and thumb strength builder.'),
    ('2-inch Pinch Block Lift','loading_pin','preferred',80,'Common loading method for a pinch block.'),
    ('Pinch Block Hold','pinch_block','required',75,'Duration-based pinch accessory.'),
    ('2-inch Thumb Blaster Lift','thumb_blaster_2in','required',100,'Direct event-specific implement practice.'),
    ('2-inch Thumb Blaster Lift','loading_pin','preferred',90,'Common loading method for the implement.'),
    ('Thick Handle Hammer Lift','thick_handled_heavy_hammer','required',100,'Direct heavy-hammer practice.'),
    ('Thick Handle Hammer Hold','thick_handled_heavy_hammer','required',90,'Specific thick-handle and wrist endurance accessory.'),
    ('Strongman Log Clean and Press','strongman_log','required',100,'Direct max-log event practice.'),
    ('Strongman Log Press from Rack','strongman_log','required',85,'Press-specific log accessory without the clean.'),
    ('Sandbag to Shoulder','sandbag','required',100,'Direct sandbag-to-shoulder event practice.'),
    ('Sandbag Bear-Hug Carry','sandbag','required',70,'General sandbag strength and conditioning transfer.'),
    ('Conan Carry','conans_wheel','required',100,'Direct Conan''s Wheel practice.'),
    ('Zercher Carry','conans_wheel','substitute',70,'Front-loaded elbow carry substitute when a wheel is unavailable.'),
    ('Front-Loaded Sandbag Carry','conans_wheel','substitute',50,'Lower-specificity front-loaded carry fallback.'),
    ('Strongman Deadlift','kratos_mammoth_bar','preferred',100,'Use the contest bar when available for maximal specificity.')
)
insert into public.exercise_implement_options (exercise_id, implement_id, relationship, specificity, notes)
select e.id, i.id, m.relationship, m.specificity, m.notes
from mappings m
join public.exercises e on e.owner_id is null and lower(e.name) = lower(m.exercise_name)
join public.specialty_implements i on i.slug = m.implement_slug
on conflict (exercise_id, implement_id) do update
set relationship = excluded.relationship, specificity = excluded.specificity, notes = excluded.notes;

-- Explicit event transfer lets coaching rank direct practice above useful substitutes/accessories.
with transfers(event_slug, exercise_name, specificity, notes) as (
  values
    ('grip_thumb_blaster_max','2-inch Thumb Blaster Lift',100,'Direct event practice.'),
    ('grip_thumb_blaster_max','2-inch Pinch Block Lift',75,'Builds pinch and thumb force with a more common implement.'),
    ('grip_thumb_blaster_max','Pinch Block Hold',55,'Builds thumb and pinch endurance.'),
    ('grip_heavy_hammer_ladder','Thick Handle Hammer Lift',100,'Direct event-pattern practice.'),
    ('grip_heavy_hammer_ladder','Thick Handle Hammer Hold',75,'Builds handle and wrist endurance.'),
    ('grip_nightmare_hercules','Hercules Hold',90,'Closely related paired-handle support hold.'),
    ('grip_nightmare_hercules','Farmer Handle Hold',75,'Heavy support-grip duration substitute.'),
    ('grip_nightmare_hercules','Heavy Dumbbell Hold',45,'Accessible general support-grip fallback.'),
    ('strongman_hercules_hold','Hercules Hold',100,'Direct event practice.'),
    ('strongman_hercules_hold','Farmer Handle Hold',80,'Highly useful support-grip substitute.'),
    ('strongman_hercules_hold','Heavy Dumbbell Hold',50,'Commercial-gym fallback.'),
    ('strongman_max_log_press','Strongman Log Clean and Press',100,'Direct event practice.'),
    ('strongman_max_log_press','Strongman Log Press from Rack',80,'Overhead-specific accessory.'),
    ('strongman_max_deadlift','Strongman Deadlift',100,'Direct event-pattern practice.'),
    ('strongman_conans_wheel','Conan Carry',100,'Direct event practice.'),
    ('strongman_conans_wheel','Zercher Carry',70,'Similar front-loaded elbow support and locomotion.'),
    ('strongman_conans_wheel','Front-Loaded Sandbag Carry',50,'Accessible front-loaded carry fallback.'),
    ('strongman_sandbag_series','Sandbag to Shoulder',100,'Direct event practice.'),
    ('strongman_sandbag_series','Sandbag Bear-Hug Carry',55,'Builds sandbag handling and work capacity.')
)
insert into public.competition_event_exercise_transfer (event_id, exercise_id, specificity, notes)
select ce.id, e.id, t.specificity, t.notes
from transfers t
join public.competition_events ce on ce.slug = t.event_slug
join public.exercises e on e.owner_id is null and lower(e.name) = lower(t.exercise_name)
on conflict (event_id, exercise_id) do update
set specificity = excluded.specificity, notes = excluded.notes;
