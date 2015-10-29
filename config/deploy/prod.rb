set :stage, :prod

server ENV['SERVER_1'], user: fetch(:user), port: 22, roles: %w{app}
server ENV['SERVER_2'], user: fetch(:user), port: 22, roles: %w{app}
