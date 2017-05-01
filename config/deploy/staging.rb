set :stage, :prod

server ENV['STAGING_SERVER'], user: 'deploy', port: 22, roles: %w{app}
