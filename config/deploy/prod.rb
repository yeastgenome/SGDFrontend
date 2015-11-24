set :stage, :prod

server ENV['PROD_SERVER_1'], user: fetch(:user), port: 22, roles: %w{app}
server ENV['PROD_SERVER_2'], user: fetch(:user), port: 22, roles: %w{app}
