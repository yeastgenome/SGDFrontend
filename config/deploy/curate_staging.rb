set :stage, :prod

server ENV['CURATE_STAGING_SERVER'], user: 'deploy', port: 22, roles: %w{app}
