set :stage, :prod

server ENV['STAGING_SERVER_A'], user: 'deploy', port: 22, roles: %w{app}
