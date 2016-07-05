set :stage, :prod

server ENV['AWS_SERVER'], user: 'deploy', port: 22, roles: %w{app}
