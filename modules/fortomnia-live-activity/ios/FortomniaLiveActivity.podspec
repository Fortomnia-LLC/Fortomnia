Pod::Spec.new do |s|
  s.name           = 'FortomniaLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Fortomnia workout Live Activity bridge'
  s.description    = 'Expo module that starts, updates, and ends Fortomnia workout Live Activities.'
  s.author         = 'Fortomnia LLC'
  s.homepage       = 'https://fortomnia.com'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ActivityKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
