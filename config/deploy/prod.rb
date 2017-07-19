set :stage, :prod

server ENV['PROD_SERVER_A'], user: 'deploy', port: 22, roles: %w{app}
server ENV['PROD_SERVER_B'], user: 'deploy', port: 22, roles: %w{app}
