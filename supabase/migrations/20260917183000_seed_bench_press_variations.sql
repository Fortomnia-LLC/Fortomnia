insert into public.exercise_variants (
  exercise_id,
  name,
  grip,
  attachment,
  stance,
  laterality,
  execution_style,
  aliases,
  is_default,
  sort_order
)
select
  exercises.id,
  variation.name,
  variation.grip,
  variation.attachment,
  variation.stance,
  variation.laterality,
  variation.execution_style,
  variation.aliases,
  variation.is_default,
  variation.sort_order
from public.exercises
cross join (
  values
    (
      'Standard Barbell',
      'overhand',
      'straight barbell',
      'flat bench',
      'bilateral',
      'standard',
      array['olympic barbell bench press', 'straight bar bench press'],
      true,
      10
    ),
    (
      'Bull Bar',
      'overhand',
      'bull bar',
      'flat bench',
      'bilateral',
      'specialty bar',
      array['bull bar bench press'],
      false,
      20
    ),
    (
      'Hurricane Bar',
      'overhand',
      'hurricane bar',
      'flat bench',
      'bilateral',
      'oscillating specialty bar',
      array['hurricane bar bench press'],
      false,
      30
    ),
    (
      'Buffalo Bar',
      'overhand',
      'buffalo bar',
      'flat bench',
      'bilateral',
      'cambered specialty bar',
      array['buffalo bar bench press', 'duffalo bar bench press'],
      false,
      40
    ),
    (
      'Cambered Bar',
      'overhand',
      'cambered bar',
      'flat bench',
      'bilateral',
      'cambered specialty bar',
      array['cambered bench press'],
      false,
      50
    ),
    (
      'Swiss / Football Bar',
      'neutral',
      'multi-grip bar',
      'flat bench',
      'bilateral',
      'neutral-grip specialty bar',
      array['swiss bar bench press', 'football bar bench press', 'multi grip bench press'],
      false,
      60
    ),
    (
      'Bamboo / Earthquake Bar',
      'overhand',
      'bamboo bar',
      'flat bench',
      'bilateral',
      'oscillating load',
      array['bamboo bar bench press', 'earthquake bar bench press'],
      false,
      70
    ),
    (
      'Axle Bar',
      'overhand',
      'axle bar',
      'flat bench',
      'bilateral',
      'thick bar',
      array['axle bench press', 'fat bar bench press'],
      false,
      80
    )
) as variation(
  name,
  grip,
  attachment,
  stance,
  laterality,
  execution_style,
  aliases,
  is_default,
  sort_order
)
where lower(exercises.name) = 'barbell bench press'
  and exercises.owner_id is null
on conflict (exercise_id, name) do update set
  grip = excluded.grip,
  attachment = excluded.attachment,
  stance = excluded.stance,
  laterality = excluded.laterality,
  execution_style = excluded.execution_style,
  aliases = excluded.aliases,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order;
