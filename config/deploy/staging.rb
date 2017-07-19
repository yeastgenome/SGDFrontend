set :stage, :prod

server ENV['STAGING_SERVER_A'], ENV['STAGING_SERVER_B']
user: 'deploy',
port: 22,
roles: %w{app}
