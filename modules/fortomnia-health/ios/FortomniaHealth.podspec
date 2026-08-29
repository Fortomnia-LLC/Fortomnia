Pod::Spec.new do |s|
  s.name = 'FortomniaHealth'
  s.version = '1.0.0'
  s.summary = 'Fortomnia Apple Health bridge'
  s.description = 'Expo module that provides Fortomnia access to authorized Apple Health data.'
  s.author = 'Fortomnia'
  s.homepage = 'https://github.com/grc0830-source/IronForge'
  s.platforms = { :ios => '15.1' }
  s.source = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
