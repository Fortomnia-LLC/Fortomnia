Pod::Spec.new do |s|
  s.name           = 'FortomniaWatch'
  s.version        = '1.0.0'
  s.summary        = 'Fortomnia Apple Watch connectivity bridge'
  s.description    = 'Transfers workout snapshots, queued actions, and acknowledgements between Fortomnia and its watchOS companion.'
  s.author         = 'Fortomnia'
  s.homepage       = 'https://fortomnia.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WatchConnectivity'
  s.source_files = '**/*.{h,m,mm,swift}'
end
