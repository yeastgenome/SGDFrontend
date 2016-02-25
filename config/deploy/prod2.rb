set :stage, :prod2

server ENV['SERVER_2'], user: fetch(:user), port: 22, roles: %w{app}