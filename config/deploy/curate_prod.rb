set :stage, :prod

server ENV['CURATE_PROD_SERVER'], user: 'deploy', port: 22, roles: %w{app}
